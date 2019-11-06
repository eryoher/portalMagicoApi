'use strict';

const RESTUtils = require('../utils/RESTUtils');
const ERROR_GENERIC = 'Error conexion con el servidor';
const sendEmail = require('../utils/sendEmail');
const CodeGenerator = require('../utils/CodeGenerator');


module.exports = function (AuthorizationCode) {

    const generateCode = async function () {

        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const long = 8;

        try {
            let pass = '';
            for (let index = 0; index < long; index++) {
                pass += characters.charAt(Math.floor(Math.random() * characters.length));
            }

            return pass;

        } catch (error) {
            console.error(error);
            throw RESTUtils.getServerErrorResponse(ERROR_GENERIC);
        }
    }

    /**
     * To search promotions to admin form
     * @param {object} params data for search
     * @param {Function(Error, object)} callback
     */

    AuthorizationCode.remoteMethod('createCode', {
        accepts: [
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'params', type: 'object', 'description': 'create authorization code', 'http': { 'source': 'body' } },

        ],
        returns: {
            type: 'object',
            root: true,
            description: 'response data of service'
        },
        description: 'Create Authorization Code',
        http: {
            verb: 'post'
        },
    });

    AuthorizationCode.createCode = async function (req, params) {

        try {
            let exists = null
            let pass = '';
            const user = await AuthorizationCode.app.models.users.findOne({ where: { email: params.email } });
            do {
                pass = await CodeGenerator.generateCode(8);
                exists = await AuthorizationCode.findOne({ where: { code: pass } });  //Se valida de que el codigo sea unico.            
            } while (exists !== null);
            const paramsTosave = { code: pass, promotionsId: params.promotion.id, usersId: user.id, status: 'open' }
            const authorization = await AuthorizationCode.create(paramsTosave);
            //console.log(authorization, params);
            if (authorization.id) {
                sendEmail.sendBuyPromotionEmail({ code: authorization.code, ...params });
            }

            return RESTUtils.buildSuccessResponse({ data: authorization });

        } catch (error) {
            console.error(error);
            throw RESTUtils.getServerErrorResponse(ERROR_GENERIC);
        }
    }

    /**
     * To search promotions to admin form
     * @param {object} params data for search
     * @param {Function(Error, object)} callback
     */

    AuthorizationCode.remoteMethod('getMyPromotions', {
        accepts: [
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'params', type: 'object', 'description': 'create authorization code', 'http': { 'source': 'body' } },

        ],
        returns: {
            type: 'object',
            root: true,
            description: 'response data of service'
        },
        description: 'Create Authorization Code',
        http: {
            verb: 'post'
        },
    });

    AuthorizationCode.getMyPromotions = async function (req, params) {
        try {
            const promotions = await AuthorizationCode.find({ where: { ...params }, include: ['promotions'] });
            return RESTUtils.buildSuccessResponse({ data: promotions });

        } catch (error) {
            console.error(error);
            throw RESTUtils.getServerErrorResponse(ERROR_GENERIC);
        }
    }

    /**
    * To search promotions to admin form
    * @param {object} params data for search
    * @param {Function(Error, object)} callback
    */

    AuthorizationCode.remoteMethod('checkCode', {
        accepts: [
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'params', type: 'object', 'description': 'Validate Authorization code', 'http': { 'source': 'body' } },

        ],
        returns: {
            type: 'object',
            root: true,
            description: 'response data of service'
        },
        description: 'Validate Authorization code',
        http: {
            verb: 'post'
        },
    });

    AuthorizationCode.checkCode = async function (req, params) {
        try {
            let authorization = await AuthorizationCode.findOne({ where: { ...params }, include: { 'promotions': ['assets'] } })

            if (!authorization) {
                authorization = "El codigo no fue encontrado."
            }
            return RESTUtils.buildSuccessResponse({ data: authorization });

        } catch (error) {
            console.error(error);
            throw RESTUtils.getServerErrorResponse(ERROR_GENERIC);
        }
    }

    /**
     * To search promotions to admin form
     * @param {object} params data for search
     * @param {Function(Error, object)} callback
     */

    AuthorizationCode.remoteMethod('validateCode', {
        accepts: [
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'params', type: 'object', 'description': 'Validate Authorization code', 'http': { 'source': 'body' } },

        ],
        returns: {
            type: 'object',
            root: true,
            description: 'response data of service'
        },
        description: 'Validate Authorization code',
        http: {
            verb: 'post'
        },
    });

    AuthorizationCode.validateCode = async function (req, params) {
        try {
            let authorization = await AuthorizationCode.findOne({ where: { ...params }, include: { 'promotions': ['assets'] } })

            if (authorization) {
                await authorization.updateAttributes({ status: 'closed' });
            } else {
                authorization = "El codigo no fue encontrado."
            }
            return RESTUtils.buildSuccessResponse({ data: authorization });

        } catch (error) {
            console.error(error);
            throw RESTUtils.getServerErrorResponse(ERROR_GENERIC);
        }
    }


    /**
   * To search Authoriztion codes by one requerimient
   * @param {object} params data for search
   * @param {Function(Error, object)} callback
   */


    AuthorizationCode.remoteMethod('search', {
        accepts: [
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'params', type: 'object', 'description': 'all object data', 'http': { 'source': 'body' } },

        ],
        returns: {
            type: 'object',
            root: true,
            description: 'response data of service'
        },
        description: 'Post current category',
        http: {
            verb: 'post'
        },
    });

    AuthorizationCode.search = async function (req, params) {
        const limitQuery = (params.pageSize) ? params.pageSize : 10;
        const page = (params.page) ? ((params.page - 1) * limitQuery) : 0;
        const filterData = [];

        try {
            const filter = (params.companyId) ? {
                include: ['promotions', 'users']
            } : {
                limit: limitQuery,
                skip: page,                
                include: ['promotions', 'users']
            };

            const [total, data] = await Promise.all([
                AuthorizationCode.count(),
                AuthorizationCode.find(filter)
            ])

            if(params.companyId){
                data.forEach(code => {     
                    if (code.promotions() && code.promotions().companyId === params.companyId ) {
                        filterData.push(code);
                    }
                });
            }

            const resultData = (filterData.length) ? filterData : data;

            return RESTUtils.buildResponse(resultData, limitQuery, (params.page) ? params.page : page, (filterData.length) ? filterData.length : total  );

        } catch (error) {
            console.error(error);
            throw RESTUtils.getServerErrorResponse(ERROR_GENERIC);
        }
    }
};
