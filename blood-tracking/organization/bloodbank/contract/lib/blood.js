/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for ledger state
const State = require('../ledger-api/state.js');

// Enumerate commercial paper state values
const DINSTATE = {
    READY: 'READY',
    UNDER_TRANSPORTATION: 'UNDER_TRANSPORTATION',
    DELIEVERED: 'DELIEVERED',
    USED: 'USED'
};


/**
 * Blood class extends State class
 * Class will be used by application and smart contract to define a paper
 */
class Blood extends State {

    constructor(obj) {
        super(Blood.getClass(), [obj.donorID, obj.DIN]);
        Object.assign(this, obj);
    }
    /**
     * Basic getters and setters
    */
    getKey(){
    return (this.donorID+":"+this.DIN);
    }
    getTimeStamp(){
        return this.timeStamp;
    }
    setTimeStamp(newTimeStamp){
        this.timeStamp = newTimeStamp;
    }
    getLocation() {
    return this.location;
    }

    setLocation(newLocation) {
        this.location = newLocation;
    }

    getPatient() {
        return this.patientID;
    }

    setPatient(newPatient) {
        this.patientID = newPatient;
    }
    getDonor(){
        return this.donorID;
    }
    setReady() {
        this.currentState = DINSTATE.READY;
    }
    setUnderTransportation() {
        this.currentState = DINSTATE.UNDER_TRANPORTATION;
    }
    setDelievered() {
        this.currentState = DINSTATE.DELIEVERED;
    }
    setUsed() {
        this.currentState = DINSTATE.USED;
    }
    isReady() {
        return this.currentState === DINSTATE.READY;
    }
    isUnderTransportation() {
        return this.currentState === DINSTATE.UNDER_TRANPORTATION;
    }
    isDelievered() {
        return this.currentState === DINSTATE.DELIEVERED;
    }
    isUsed() {
        return this.currentState === DINSTATE.USED;
}
    static fromBuffer(buffer) {
        return Blood.deserialize(Buffer.from(JSON.parse(buffer)));
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    /**
     * Deserialize a state data to Blood
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, Blood);
    }

    /**
     * Factory method to create a blood bag object
     */
    static createInstance(DIN, mm, type, date, expired, test, donorID, temperature, timeStamp) {
        return new Blood({ DIN, mm, type, date, expired, test, donorID, temperature,timeStamp, currentOwner: 'Cairo Central', location: 'Blood Bank', patientID: 'NONE', currentState: DINSTATE.READY});
    }

    static getClass() {
        return 'org.blood';
    }
}
module.exports = Blood;