import SteamUser from 'steam-user';

interface EnableResponse {
  status: number;
  shared_secret: Buffer;
  identity_secret: Buffer;
  revocation_code: Buffer;
}

interface EnableResult {
  client: SteamUser;
  response: EnableResponse;
}

export function enableTwoFactor(username: string, password: string): Promise<EnableResult> {
  return new Promise((resolve, reject) => {
    const client = new SteamUser();
    client.logOn({
      accountName: username,
      password: password,
    });

    client.once('error', (err) => {
      reject(err);
    });

    client.once('loggedOn', () => {
      client.enableTwoFactor((err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve({ client, response: response as EnableResponse });
        }
      });
    });
  });
}

export function finalizeTwoFactor(result: EnableResult, activationCode: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const { client, response } = result;
    client.finalizeTwoFactor(response.shared_secret, activationCode, (err) => {
      client.logOff();
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
