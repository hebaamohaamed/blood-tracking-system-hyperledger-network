/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Fabric smart contract classes
const { Contract, Context } = require('fabric-contract-api');

// PaperNet specifc classes
const Blood = require('./blood');
const Process = require('./process');
const DINSTATE = require ('./blood')
const BloodList = require('./bloodlist');
const ProcessList = require('./processlist');


/**
 * A custom context provides easy access to list of all blood bags
 */
class BloodContext extends Context {

    constructor() {
        super();
        this.bloodList = new BloodList(this);
        this.processList = new ProcessList(this);
    }

}

/**
 * Define Blood Smart Contract
 *
 */
class BloodContract extends Contract {

    constructor() {
        // Unique namespace when multiple contracts per chaincode file
        super('org.blood');
    }

    /**
     * Define a custom context for blood
    */
    createContext() {
        return new BloodContext();
    }

    /**
     * Instantiate to perform any setup of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async instantiate(ctx) {
        console.log('============= START : Initialize ledger ===========');
        const blood = new Array();
        blood[0] = Blood.createInstance('BD58911', '100', 'B+', '2021-02-19', '2021-06-19', 'SAFE', 'd524', '2C');
        blood[1] = Blood.createInstance('BD58912', '250', 'B+', '2021-02-20', '2021-06-20', 'SAFE', 'd524', '3C' );
        blood[2] = Blood.createInstance('BD58913', '400', 'AB+', '2021-02-21', '2021-06-21', 'SAFE', 'd526', '4C' );

        for (let i = 0; i < blood.length; i++) {
            await ctx.bloodList.addBlood(blood[i]);
            console.log('Added <--> ', blood[i]);
         }

         const process =  new Array();
         process[0] = Process.createInstance('P4367', 'd524:BD58911','d524','H4657','B47745','donate');
         process[1] = Process.createInstance('P4347', 'd524:BD58911','r301','H4657','B47745','recieve');
         //process[2] = Process.createInstance('P4369','U3774','H4657','B47745','donate');
 
         for (let i = 0; i < process.length; i++) {
             await ctx.processList.addProcess(process[i]);
             console.log('Added <--> ', process[i]);
         }

        console.log('============= END : Initialize ledger ===========');
    }
    /**
     * Create Blood Bag
     *
     * @param {Context} ctx the transaction context
     * @param {String} DIN blood bag DIN
     * @param {String} mm blood bag mm
     * @param {String} type blood bag type
     * @param {String} date blood bag creation date 
     * @param {String} expired blood bag expired dtae
     * @param {String} test blood bag test result
     * @param {String} donorID blood bag donor id
     * @param {String} temperature blood bag temperature
    */
   async createBloodBag(ctx, DIN, mm, type, date, expired, test, donorID, temperature) {

    const bloodnum = donorID + ":" + DIN;
    // Check if the blood bag already exists
    if (await ctx.bloodList.bagExists(bloodnum)) {
        throw new Error(`Blood Bag with ID ${bloodnum} is already exist`);
    }

    //check if this is a valid donor id
    if(donorID.startsWith("d")){
        // create blood bag
        let blood = Blood.createInstance(DIN, mm, type, date, expired, test, donorID, temperature);
        // Append blood asset to ledger
        await ctx.bloodList.addBlood(blood);
        console.log('============= END : Add Blood Bag ===========');
        return blood;
        }
    else{
        throw new Error(`it's not a donor ID `);
        }
    }
    /**
     * Query All Blood Bags
     * @param {Context} ctx the transaction context
     */
    async queryAllBlood(ctx) {
        console.log('============= START : Query All===========');
        return await ctx.bloodList.getBloodBags();
    }
    /**
     * Query one blood bag with blood number
     * @param { Context } ctx smart contract transaction context
     * @param { bloodNumber } blood number to query
     */
    async queryBloodBag(ctx, bloodNumber){

        // Check if the blood bag exists
        if (!await ctx.bloodList.bagExists(bloodNumber)) {
            throw new Error(`Blood Bag with ID ${bloodNumber} doesn't exists`);
        }
        // Return blood asset from ledger
        return await ctx.bloodList.getBlood(bloodNumber);
    }
    /**
     * Convert to under_transportation state
     * @param { Context } ctx smart contract transaction context
     * @param { bloodNumber } blood number to query
     */
    async underTransportBloodDIN(ctx, bloodNumber) {
    
        console.log('============= START : underTransportationBloodDIN ===========');

        // Check whether the blood bag exists
        if (!ctx.bloodList.bagExists(bloodNumber)) {
            throw new Error(`Error blood bag ${bloodNumber} doesn't exists `);
        }

        // Get blood bag by blood number
        const blood = await ctx.bloodList.getBlood(bloodNumber);


        //check if location is blood bank
        if(blood.location != "Blood Bank"){
            throw new Error(`Error location is not valid`);
        }

        //check if test is safe
        if(blood.test != "SAFE"){
            throw new Error(`Error this bag is not safe to be transported`);
        }

        // If state is not equal to ready
        if (blood.currentState != "READY") {
            throw new Error(`Error blood bag state is not valid`);
        }
        // Change din state to "UNDER_TRANSPORTATION"
        blood.currentState = "UNDER_TRANSPORTATION";
        // Update state in ledger
        await ctx.bloodList.updateBlood(blood);

        ctx.stub.setEvent('UNER_TRANSPORTATION_DIN', blood.toBuffer());
        console.log('============= END : underTransportationBloodDIN ===========');
    }
    /**
     * Convert to delievered state
     * @param { Context } ctx smart contract transaction context
     * @param { bloodNumber } blood number to query
     */

     async delieveredBloodDIN(ctx, bloodNumber) {
        
        console.log('============= START : delieveredBloodDIN ===========');
    
        // Check if the blood bag exists
        if (! await ctx.bloodList.bagExists(bloodNumber)) {
            throw new Error(`Error blood bag  ${bloodNumber} doesn't exists `);
        }

        // Get blood bag by blood number
        const blood = await ctx.bloodList.getBlood(bloodNumber);
        
        //check if location is blood bank
        if(blood.location != "Transportation"){
            throw new Error(`Error location is not valid`);
        }
        // If state is not equal to UNDER_TRANSPORTATION
        if (blood.currentState != "UNDER_TRANSPORTATION") {
            throw new Error(`Error state of blood bag is not valid`);
        }
        // Set din state to "Delievered"
        blood.currentState = "DELIEVERED";
        // Update state in ledger
        await ctx.bloodList.updateBlood(blood);

        ctx.stub.setEvent('DIN_DELIEVERED', blood.toBuffer());
        console.log('============= END : delieverBloodDIN ===========');
    }
    /**
     * Convert to used state
     * @param { Context } ctx smart contract transaction context
     * @param { bloodNumber } blood number to issue DIN
     * @param { patientID } blood patientID
     */
    async usedBloodDIN(ctx, bloodNumber, patientID) {
        console.log('============= START : UsedBloodDIN ===========');

        // Check if the Blood Bag exists
        if (! await ctx.bloodList.bagExists(bloodNumber)) {
            throw new Error(`Error blood bag ${bloodNumber} doesn't exists `);
        }

        // Get blood by blood number
        const blood = await ctx.bloodList.getBlood(bloodNumber);

        //check if location is blood bank
        if(blood.location != "Hospital"){
            throw new Error(`Error location is not valid`);
        }

        //check if patient id begins with r
        if(!patientID.startsWith("r")){
            throw new Error(`Error user id is not valid`);
        }

        blood.patientID = patientID;

        // If din state is not equal DELIEVERED
        if (blood.currentState != "DELIEVERED") {
            throw new Error(`Error state of blood bag is not valid`);
        }
        // Set din state to "USED"
        blood.currentState = "USED";
        // Update state in ledger
        await ctx.bloodList.updateBlood(blood);

        ctx.stub.setEvent('DIN_USED', blood.toBuffer());
        console.log('============= END : usedBloodDIN ===========');
    }
    /**
     * Change blood bag owner/location
     * @param { Context } ctx smart contract transaction context
     * @param { bloodNumber } blood number
     * @param { location } blood location
     * @param { currentOwner } blood owner
     */
    async changeBloodBagLocation(ctx, bloodNumber, location, currentOwner) {
     
        console.log('============= START : Change Blood Bag Owner ===========');

        // Get blood bag by blood number
        const blood = await ctx.bloodList.getBlood(bloodNumber);
    
        //check if location is transportation
        if(location == "Transportation"){
            if(blood.currentState != "UNDER_TRANSPORTATION"){
                throw new Error(`Error we can't change location`);
            }
        }
        //check if location is hospital
        if(location == "Hospital"){
            if(blood.currentState != "DELIEVERED"){
                throw new Error(`Error we can't change location`);
            }
        }
        //check if location is patient
        if(location == "Patient"){
            if(blood.currentState !== "USED"){
                throw new Error(`Error we can't change location`);
            }
        }
        // Change blood bag location
        blood.location = location;

        // Change blood bag owner
        blood.currentOwner = currentOwner; 

        // Update state in ledger
        await ctx.bloodList.updateBlood(blood);
        console.log('============= END : changeBloodBagOwner ===========');

        return blood;
    }
    /**
     * @param  { Context } ctx Blood context.
     * @param  {bloodNumber} blood Blood number to return history for
     */
    async getHistoryForBloodBag(ctx, bloodNumber) {
        return await ctx.bloodList.getBloodBagHistory(bloodNumber);
    }

    /**
    * queryOwner commercial paper: supply name of owning org, to find list of blood bags based on owner field
    * @param {Context} ctx the transaction context
    * @param {String} donorID blood bag owner
    */
    async queryDonorOwner(ctx, donorID) {

        return await ctx.bloodList.queryByDonor(donorID);
    }
    /**
    * queryOwner commercial paper: supply name of owning org, to find list of blood bags based on owner field
    * @param {Context} ctx the transaction context
    * @param {String} patientID blood bag owner
    */
    async queryPatientOwner(ctx, patientID) {

        return await ctx.bloodList.queryByPatient(patientID);
    }
    /**
    * queryOwner commercial paper: supply name of owning org, to find list of blood bags based on owner field
    * @param {Context} ctx the transaction context
    * @param {String} hospitalID blood bag owner
    */
    async queryHospitalOwner(ctx, hospitalID) {

        return await ctx.processList.queryByHospital(hospitalID);
    }
    /**
    * queryOwner commercial paper: supply name of owning org, to find list of blood bags based on owner field
    * @param {Context} ctx the transaction context
    * @param {String} bloodBankID blood bag owner
    */
    async queryBloodBankOwner(ctx, bloodBankID) {

        return await ctx.processList.queryByBloodBank(bloodBankID);
    }
    /**
    * @param {Context} ctx the transaction context
    * @param {currentOwner} blood blood bag owner
    * @param {type} blood blood bag type
    * @param {currentState} blood blood bag state
    */    
    async searchBloodType(ctx, type) {
        return await ctx.bloodList.queryType(type);
    } 

     /**
      * Create a process
     * @param { Context } ctx smart contract transaction context.
     * @param { processID } process processID.
     * @param { userID } process userID.
     * @param { hospitalID } process hospitalID.
     * @param { bloodBankID } process bloodBankID.
     * @param { type } process type.
     */
    async createProcess(ctx, processID, bloodNumber, userID, hospitalID, bloodBankID, type) {
 
        console.log('============= START : Create Process ===========');

        const processnum = processID + ":" + type;
        // Check if the process already exists
        if (await ctx.processList.processExists(processnum)) {
            throw new Error(`Process with ID ${processnum} is already exist`);
        }

        // Check if the blood bag exists
        if (!await ctx.bloodList.bagExists(bloodNumber)) {
            throw new Error(`Blood Bag with ID ${bloodNumber} doesn't exists`);
        }
        
        //check if process is donate that user id begins with "d"
        if(type == "donate"){
            if(!userID.startsWith("d")){
                throw new Error(`Error user id is not valid`);
            }
        }
        //check if process is recieve that user id begins with "r"
        if(type == "recieve"){
            if(!userID.startsWith("r")){
                throw new Error(`Error user id is not valid`);
            }
        }

        let process = Process.createInstance(processID, bloodNumber, userID, hospitalID, bloodBankID, type);
        // Append process asset to ledger
        await ctx.processList.addProcess(process);
 
        console.log('============= END : Add Process ===========');
        return process;
    }

    /**
     * Query all processes
     * @param { Context } ctx smart contract transaction context
     */
    async queryAllProcess(ctx){
        return await ctx.processList.getProcesses();
    }

    /**
     * Query a process by its number
     * @param { Context } ctx smart contract transaction context
     * @param { processNumber } process number to query
     */
    async queryProcess(ctx, processNumber) {

        // Check if the process exists
        if (!await ctx.processList.processExists(processNumber)) {
            throw new Error(`Process with ID ${processNumber} doesn't exists`);
        }

        // Return blood asset from ledger
        return await ctx.processList.getProcess(processNumber);
    }
       
}

module.exports = BloodContract;