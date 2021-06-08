/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('../ledger-api/statelist');

const Process = require('./process');

class ProcessList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.processlist');
        this.use(Process);
    }

    async addProcess(process) {
        return this.addState(process);
    }

    async getProcess(processKey) {
        return this.getState(processKey);
    }

    async updateProcess(process) {
        return this.updateState(process);
    }
    async getProcesses() {
        return this.getStates();
    }
    async processExists(processKey) {
        return this.exists(processKey);
    }
    async queryByHospital(hospitalID) {
        return this.queryKeyByHospital(hospitalID);
    }
    async queryByBloodBank (bloodBankID){
        return this.queryKeyByBloodBank(bloodBankID)
    }
}


module.exports = ProcessList;