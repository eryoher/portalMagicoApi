'use strict';
const RESTUtils = require('../utils/RESTUtils');
const ERROR_GENERIC = ' Error conexion con el servidor ';
const GET_NOTIFICATION = 'Success';
const Axios = require('axios');
const TOKEN_dev = 'TEST-4162175641553215-081420-696d25072b00310b8133f083cf544e71-236778780'; //SandBox
const TOKEN = 'APP_USR-4162175641553215-081420-b4177e24c5758a2e325198970908b2bf-236778780';

module.exports = function(Notification) {
    /**
     * To check notifications
     * @param {object} params data for search
     * @param {Function(Error, object)} callback
    */   

    Notification.remoteMethod('checkPayment', {
        accepts: [
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'params', type: 'object', 'description': 'all object data', 'http': { 'source': 'body' } },

        ],
        returns: {
            type: 'object',
            root: true,
            description: 'response data of service'
        },
        description: 'Post current quotation',
        http: {
            verb: 'post'
        },
    });


    Notification.checkPayment = async function (req, params) {
        
        try {
            const data = {
                ...params,
                notification_id : params.id,
                payment_id: (params.data) ? params.data.id : null,
                data: JSON.stringify(params)
            }
            delete data.id;                       
            if( params.type ){
                const responData = await Notification.create( data );
                const payment = await getPayment( responData.payment_id );
                if( payment.status == 'approved' ){
                    const order = await getOrderMercadoPago( payment.order.id );
                    const preference = await getPreferenceMercadoPago( order.preference_id );
                    const promotion = await Notification.app.models.promotions.findById( preference.external_reference, {include:['company']} );
                    const dataCard = {
                        phone_number:preference.payer.phone.number,
                        country_code:'+57',
                        email:preference.payer.email,
                        first_name:preference.payer.name,
                        last_name:preference.payer.surname,
                        promotion:promotion,
                        kind:"P",
                        currency:"COP"
                    }                             
                    const dataQuantity = {
                        quantity: preference.items[0].quantity,
                        promotionsId:preference.external_reference,
                        type:2
                    }

                    await Promise.all([
                        sendGiftCard( req, dataCard, preference.items[0].quantity ),
                        addQuantitytoPromotion(req, dataQuantity)
                    ])
                } 
            }

            return RESTUtils.buildSuccessResponse({ data: GET_NOTIFICATION });

        } catch (error) {
            console.log("error",error);
            throw RESTUtils.getServerErrorResponse(error.message ? ERROR_GENERIC : error);
        }

    }

    const getPayment = async ( paymentId ) => {
        const instance = Axios.create();
        const response = await instance.get(`https://api.mercadopago.com/v1/payments/${paymentId}?access_token=${TOKEN}`);
        return response.data;
    }

    const getOrderMercadoPago = async ( orderId ) => {
        const instance = Axios.create();
        const response = await instance.get(`https://api.mercadopago.com/merchant_orders/${orderId}?access_token=${TOKEN}`);
        return response.data;
    }

    const getPreferenceMercadoPago = async ( preferenceId ) => {
        const instance = Axios.create();
        const response = await instance.get(`https://api.mercadopago.com/checkout/preferences/${preferenceId}?access_token=${TOKEN}`);
        return response.data;
    }

    const getAccessTokenCard = async () => {
        const params = {
            api_key_merchant:"eD_FLBp1mJU1yoYkX1ld7QDj4qE",
            api_key_entity:"P7Iu8hcrP6q0A2-JGQk-fUxKCxE"            
        }
        
        const instance = Axios.create();
        const response = await instance.post('https://3party.2transfair.com/entities/login', params);
        return response.data.auth_token;
    }

    const sendGiftCard = async ( req, card, quantity ) => {        
        const instance = await Notification.app.models.AuthorizationCode;
        const promises = []
        
        for (let index = 0; index < quantity; index++) {            
            promises.push( instance.createCode(req, card) ) ;            
        }   
        
        return promises;
    }

    const addQuantitytoPromotion = async (req, params ) => {
        const inventory = Notification.app.models.Inventory;
        return inventory.createInventory(req, params);
    }
    
};
