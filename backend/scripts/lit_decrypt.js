const { LitNodeClient } = require('lit-js-sdk');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function decrypt() {
  const input = JSON.parse(process.argv[2] || '{}');
  const { ciphertext, dataToEncryptHash, userAddress, chain } = input;
  
  try {
    const client = new LitNodeClient({
      litNetwork: chain || 'mumbai',
      debug: false,
    });
    await client.connect();
    
    const accessControlConditions = [
      {
        contractAddress: process.env.CHARON_SWITCH_ADDRESS || '0x0000000000000000000000000000000000000000',
        functionName: 'getUserInfo',
        functionParams: [userAddress],
        functionAbi: {
          inputs: [{ internalType: 'address', name: 'userAddress', type: 'address' }],
          name: 'getUserInfo',
          outputs: [
            { internalType: 'enum CharonSwitch.UserStatus', name: 'status', type: 'uint8' },
            { internalType: 'uint256', name: 'lastSeen', type: 'uint256' },
            { internalType: 'uint256', name: 'threshold', type: 'uint256' },
            { internalType: 'address[3]', name: 'guardians', type: 'address[3]' },
            { internalType: 'uint256', name: 'requiredConfirmations', type: 'uint256' },
            { internalType: 'uint256', name: 'confirmationCount', type: 'uint256' },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        chain: chain || 'mumbai',
        returnValueTest: {
          key: 'status',
          comparator: '=',
          value: '2', // DECEASED
        },
      },
    ];
    
    const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: chain || 'mumbai' });
    const symmetricKey = await client.getEncryptionKey({
      accessControlConditions,
      toDecrypt: dataToEncryptHash,
      chain: chain || 'mumbai',
      authSig,
    });
    
    const encryptedBlob = await LitJsSdk.base64StringToBlob(ciphertext);
    const decryptedString = await LitJsSdk.decryptString(encryptedBlob, symmetricKey);
    
    console.log(JSON.stringify({ success: true, decrypted: decryptedString }));
  } catch (error) {
    console.log(JSON.stringify({ success: false, error: error.message }));
    process.exit(1);
  }
}

decrypt();
