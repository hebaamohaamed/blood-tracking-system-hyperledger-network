#!/bin/bash
#
# SPDX-License-Identifier: Apache-2.0

function _exit(){
    printf "Exiting:%s\n" "$1"
    exit -1
}

# Where am I?
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

cd "${DIR}/organization/bloodbank/configuration/cli"
docker-compose -f docker-compose.yml up -d cliBloodbank

echo "
 Install and Instantiate a Smart Contract in either langauge

 JavaScript Contract:

 docker exec cliBloodbank peer chaincode install -n bloodcontract -v 0 -p /opt/gopath/src/github.com/contract -l node
 docker exec cliBloodbank peer chaincode instantiate -n bloodcontract -v 0 -l node -c '{\"Args\":[\"org.blood:instantiate\"]}' -C mychannel -P \"AND ('Org1MSP.member')\"

 Java Contract:

 docker exec cliBloodbank peer chaincode install -n bloodcontract -v 0 -p /opt/gopath/src/github.com/contract-java -l java
 docker exec cliBloodbank peer chaincode instantiate -n bloodcontract -v 0 -l java -c '{\"Args\":[\"org.blood:instantiate\"]}' -C mychannel -P \"AND ('Org1MSP.member')\"


 Run Applications in either langauage (can be different from the Smart Contract)

 JavaScript Client Aplications:

 To add identity to the wallet:   node addToWallet.js
 To issue the paper           :   node issue.js

 Java Client Applications:

 (remember to build the Java first with 'mvn')

 To add identity to the wallet:   java addToWallet
 To issue the paper           :   java issue
"

echo "Suggest that you change to this dir>  cd ${DIR}/organization/bloodbank/"
