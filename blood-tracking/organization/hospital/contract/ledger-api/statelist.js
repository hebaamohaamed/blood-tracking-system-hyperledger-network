/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';
const State = require('./state');
const Blood = require('../lib/blood');
/**
 * StateList provides a named virtual container for a set of ledger states.
 * Each state has a unique key which associates it with the container, rather
 * than the container containing a link to the state. This minimizes collisions
 * for parallel transactions on different states.
 */
class StateList {

    constructor(ctx, listName) {
        this.ctx = ctx;
        this.name = listName;
        this.supportedClasses = {};

    }
    /**
     * Add a state to the list. Creates a new state in worldstate with
     * appropriate composite key.  Note that state defines its own key.
     * State object is serialized before writing.
     */
    async addState(state) {
        let key = this.ctx.stub.createCompositeKey(this.name, state.getSplitKey());
        let data = State.serialize(state);
        await this.ctx.stub.putState(key, data);
    }

    /**
     * Get a state from the list using supplied keys. Form composite
     * keys to retrieve state from world state. State data is deserialized
     * into JSON object before being returned.
     */
    async getState(key) {
        let ledgerKey = this.ctx.stub.createCompositeKey(this.name, State.splitKey(key));
        let data = await this.ctx.stub.getState(ledgerKey);
        if (data){
            let state = State.deserialize(data, this.supportedClasses);
            return state;
        } else {
            return null;
        }
    }

    /**
     * Update a state in the list. Puts the new state in world state with
     * appropriate composite key.  Note that state defines its own key.
     * A state is serialized before writing. Logic is very similar to
     * addState() but kept separate becuase it is semantically distinct.
     */
    async updateState(state) {
        let key = this.ctx.stub.createCompositeKey(this.name, state.getSplitKey());
        let data = State.serialize(state);
        await this.ctx.stub.putState(key, data);
    }
    async exists(key) {
        try {
            // if the below function doesn't throw exeception then return true
            await this.getState(key);
            return true;
        } catch (err) {
            return false;
        }
    }
    async getStates() {
        return await this.query({});
    }
    async query(query){
        var stub = this.ctx.stub;
        if (!query.selector) {
            query.selector = {};
        }
        query.selector._id = {
            $regex: "." + this.name + ".",
        };
        var iterator = await stub.getQueryResult(JSON.stringify(query));
        var value = (await iterator.next()).value;
        var states = [];
        while (value) {
            var state = State.deserialize(value.getValue().toBuffer(), this.supportedClasses);
            console.log(JSON.stringify(state));
            states.push(state);
            var next = await iterator.next();
            value = next.value;
        }
        return states;
    }
    async getAll(){
        return this.query({});
    }

    /**
     * Function getAllResults
     * @param {resultsIterator} iterator within scope passed in
     * @param {Boolean} isHistory query string created prior to calling this fn
    */
   async getAllResults(iterator, isHistory) {
    let allResults = [];
    let res = { done: false, value: null };

    while (true) {
        res = await iterator.next();
        let jsonRes = {};
        if (res.value && res.value.value.toString()) {
            if (isHistory && isHistory === true) {
                //jsonRes.TxId = res.value.tx_id;
                jsonRes.TxId = res.value.txId;
                jsonRes.Timestamp = res.value.timestamp;
                jsonRes.Timestamp = new Date((res.value.timestamp.seconds.low * 1000));
                let ms = res.value.timestamp.nanos / 1000000;
                jsonRes.Timestamp.setMilliseconds(ms);
                if (res.value.is_delete) {
                    jsonRes.IsDelete = res.value.is_delete.toString();
                } else {
                    try {
                        jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));

                    } catch (err) {
                        console.log(err);
                        jsonRes.Value = res.value.value.toString('utf8');
                    }
                }
            } else { // non history query ..
                jsonRes.Key = res.value.key;
                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                     console.log(err);
                    jsonRes.Record = res.value.value.toString('utf8');
                }
            }
            allResults.push(jsonRes);
        }
        // check to see if we have reached the end
        if (res.done) {
            // explicitly close the iterator 
            console.log('iterator is done');
            await iterator.close();
            return allResults;
        }

    }  // while true
}
    async getHistory(key) {
        let ledgerKey = await this.ctx.stub.createCompositeKey(this.name, State.splitKey(key));
        const resultsIterator = await this.ctx.stub.getHistoryForKey(ledgerKey);
        let results = await this.getAllResults(resultsIterator, true);

        return results;
    }
    /**
    * queryKeyByOwner blood 
    * @param {String} donorID donor blood bags
    */
    async queryKeyByDonor(donorID) {
          
        let self = this;
        if (arguments.length < 1) {
            throw new Error('Incorrect number of arguments. Expecting owner name.');
        }
        let queryString = {};
        queryString.selector = {};
        //  queryString.selector.docType = 'indexOwnerDoc';
        queryString.selector.donorID = donorID;
        // set to (eg)  '{selector:{owner:MagnetoCorp}}'
        let method = self.getQueryResultForQueryString;
        let queryResults = await method(this.ctx, self, JSON.stringify(queryString));
        return queryResults;
    }
    /**
    * queryKeyByOwner patient
    * @param {String} patientID patient blood bags
    */
    async queryKeyByPatient(patientID) {
      
        let self = this;
        if (arguments.length < 1) {
            throw new Error('Incorrect number of arguments. Expecting owner name.');
    }
        let queryString = {};
        queryString.selector = {};
        //  queryString.selector.docType = 'indexOwnerDoc';
        queryString.selector.patientID = patientID;
        // set to (eg)  '{selector:{owner:MagnetoCorp}}'
        let method = self.getQueryResultForQueryString;
        let queryResults = await method(this.ctx, self, JSON.stringify(queryString));
        return queryResults;
    }
    /**
    * queryKeyByOwner hospital
    * @param {String} hospitalID hospital blood bags
    */
    async queryKeyByHospital(hospitalID) {
      
        let self = this;
        if (arguments.length < 1) {
            throw new Error('Incorrect number of arguments. Expecting owner name.');
    }
        let queryString = {};
        queryString.selector = {};
        //  queryString.selector.docType = 'indexOwnerDoc';
        queryString.selector.hospitalID = hospitalID;
        // set to (eg)  '{selector:{owner:MagnetoCorp}}'
        let method = self.getQueryResultForQueryString;
        let queryResults = await method(this.ctx, self, JSON.stringify(queryString));
        return queryResults;
    }
    /**
    * queryKeyByOwner blood bank
    * @param {String} bloodBankID blood bank blood bags
    */
    async queryKeyByBloodBank(bloodBankID) {
      
        let self = this;
        if (arguments.length < 1) {
            throw new Error('Incorrect number of arguments. Expecting owner name.');
        }
        let queryString = {};
        queryString.selector = {};
        //  queryString.selector.docType = 'indexOwnerDoc';
        queryString.selector.bloodBankID = bloodBankID;
        // set to (eg)  '{selector:{owner:MagnetoCorp}}'
        let method = self.getQueryResultForQueryString;
        let queryResults = await method(this.ctx, self, JSON.stringify(queryString));
        return queryResults;
    }
    async getQueryResultForQueryString(ctx, self, queryString) {

        // console.log('- getQueryResultForQueryString queryString:\n' + queryString);

        const resultsIterator = await ctx.stub.getQueryResult(queryString);
        let results = await self.getAllResults(resultsIterator, false);

        return results;

    }
    /**
    * queryByType 
    * @param {String} type blood bag type
    * @param {String} currentState blood bag state
    */
    async queryByType(type) {
      
        let self = this;
        if (arguments.length < 1) {
            throw new Error('Incorrect number of arguments. Expecting owner name.');
    }   

        let queryString = {};
        queryString.selector = {};
        //  queryString.selector.docType = 'indexOwnerDoc';
        queryString.selector.type = type;
        //if(Blood.currentState == "DELIEVERED"){
            let method = self.getQueryResultForQueryString;
            let queryResults = await method(this.ctx, self, JSON.stringify(queryString));
            return queryResults;
        //}
    }

    /** Stores the class for future deserialization */
    use(stateClass) {
        this.supportedClasses[stateClass.getClass()] = stateClass;
    }
}

module.exports = StateList;