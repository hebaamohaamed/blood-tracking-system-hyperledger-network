/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('../ledger-api/statelist');

const Blood = require('./blood');

class BloodList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.bloodlist');
        this.use(Blood);
    }

    async addBlood(blood) {
        return this.addState(blood);
    }

    async getBlood(bloodKey) {
        return this.getState(bloodKey);
    }

    async updateBlood(blood) {
        return this.updateState(blood);
    }
    async getBloodBags() {
        return this.getStates();
    }
    async bagExists(bloodKey) {
        return this.exists(bloodKey);
    }
    async getBloodBagHistory(bloodKey) {
        return this.getHistory(bloodKey);
    }
    async queryByDonor(donorID) {
        return this.queryKeyByDonor(donorID);
    }
    async queryByPatient(patientID) {
        return this.queryKeyByPatient(patientID);
    }
    async queryType(type){
        return this.queryByType(type);
    }
}

module.exports = BloodList;