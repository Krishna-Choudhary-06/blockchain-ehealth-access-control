const fs=require('fs');
const path=require('path');
const {Gateway,Wallets}=require('fabric-network');

(async()=>{
  try{
    const ccp=JSON.parse(
      fs.readFileSync(
        path.resolve(
          process.env.HOME,
          'fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json'
        )
      )
    );

    console.log("Peers:", Object.keys(ccp.peers));

    const wallet=await Wallets.newFileSystemWallet('./wallet');

    const gateway=new Gateway();

    await gateway.connect(ccp,{
      wallet,
      identity:'appUser3',
      discovery:{
  enabled:true,
  asLocalhost:true
}
    });

    console.log("CONNECTED");

    const network=await gateway.getNetwork('mychannel');

    console.log("NETWORK");

   const contract = network.getContract(
  'ehr-registration-v3',
  'UserRegistry'
);

console.log("CONTRACT");

const result = await contract.evaluateTransaction(
  'getAllUsers'
);

console.log("RESULT:", result.toString());
console.log("RESULT:", result.toString());
    console.log(result.toString());

  }catch(e){
    console.error(e);
  }
})();