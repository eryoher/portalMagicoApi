'use strict';
const multipartyParser = require('../utils/MultiPartyParser');
const ImageSaver = require('./ImageSaver');
const config = require('../../server/config.json');
const imageSaver = new ImageSaver(`${config.imagesStoragePath}/promotions/`)
const RESTUtils = require('../utils/RESTUtils');
const ERROR_GENERIC = 'Error conexion con el servidor';
const PROMOTION_UPDATE_SUCCESS = 'La promocion se actualizo correctamente.';
const PROMOTION_CREATE_SUCCESS = 'La promocion se creo correctamente.';
const IMAGES_CONTAINER = "promotions";

module.exports = function (Promotions) {

    /**
     * To search tranport by one requerimient
     * @param {object} params data for search
     * @param {Function(Error, object)} callback
     */

    Promotions.remoteMethod('getPromotionsInterest', {
        accepts: [
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'params', type: 'object', 'description': 'all object data', 'http': { 'source': 'body' } },
        ],
        returns: {
            type: 'object',
            root: true,
            description: 'response data of service'
        },
        description: 'post current promotions',
        http: {
            verb: 'post'
        },
    });

    Promotions.getPromotionsInterest = async function (req, params) {
        let limitQuery = (params.pageSize) ? params.pageSize : 4;
        let where = {};
        const today = new Date()
        today.setHours('00', '00', '00', '00')

        if (params.categoryId) {
            where = { categoriesId: params.categoryId }
        }
        where.start_date = { 'lte': today }
        where.end_date = { 'gte': today }
        try {
            const filter = {
                where: where,
                limit: limitQuery,
                include: ['assets', 'inventory', 'company']
            };

            let data = await Promotions.find(filter);
            return RESTUtils.buildResponse(data, limitQuery);

        } catch (error) {
            console.log("error", error);
            throw RESTUtils.getServerErrorResponse(error.message ? ERROR_GENERIC : error);
        }
    }

    /**
     * To search tranport by one requerimient
     * @param {object} params data for search
     * @param {Function(Error, object)} callback
     */

    Promotions.remoteMethod('getPromotionsCategory', {
        accepts: [
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'params', type: 'object', 'description': 'all object data', 'http': { 'source': 'body' } },
        ],
        returns: {
            type: 'object',
            root: true,
            description: 'response data of service'
        },
        description: 'post current promotions',
        http: {
            verb: 'post'
        },
    });

    Promotions.getPromotionsCategory = async function (req, params) {
        let limitQuery = (params.pageSize) ? params.pageSize : 12;
        let where = {};
        const today = new Date()
        today.setHours('00', '00', '00', '00')

        if (params.categoryId) {
            where = { categoriesId: params.categoryId }
        }
        where.start_date = { 'lte': today }
        where.end_date = { 'gte': today }
        try {
            const filter = {
                where: where,
                limit: limitQuery,
                include: ['assets', 'inventory', 'company']
            };

            let data = await Promotions.find(filter);
            return RESTUtils.buildResponse(data, limitQuery);

        } catch (error) {
            console.log("error", error);
            throw RESTUtils.getServerErrorResponse(error.message ? ERROR_GENERIC : error);
        }
    }

    /**
     * To search tranport by one requerimient
     * @param {object} params data for search
     * @param {Function(Error, object)} callback
     */

    Promotions.remoteMethod('search', {
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

    Promotions.search = async function (req, params) {
        let limitQuery = (params.pageSize) ? params.pageSize : 10;
        let page = (params.page) ? ((params.page - 1) * limitQuery) : 0;
        const filtro = (params.filtro) ? params.filtro : '';

        let where = {}
        const today = new Date()
        today.setHours('00', '00', '00', '00')

        if (params.categoryId) {
            where = { categoriesId: params.categoryId }
        }
        if (filtro) {
            params.filtro = new RegExp('.*' + filtro + '.*', "i");
            where = { description: { regexp: params.filtro } };
        }

        where.start_date = { 'lte': today }
        where.end_date = { 'gte': today }
        where.quantity = { 'gt': 0 }

        try {
            const filter = {
                where: where,
                limit: limitQuery,
                skip: page,
                include: ['categories', 'assets', 'inventory', 'company']
            };

            const data = await Promotions.find(filter);
            const total = await Promotions.count(where);

            return RESTUtils.buildResponse(data, limitQuery, (params.page) ? params.page : page, total);

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

    Promotions.remoteMethod('adminSearch', {
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

    Promotions.adminSearch = async function (req, params) {
        let limitQuery = (params.pageSize) ? params.pageSize : 10;
        let page = (params.page) ? ((params.page - 1) * limitQuery) : 0;

        try {
            const filter = {
                limit: limitQuery,
                skip: page,
                include: ['categories', 'assets', 'inventory', 'company']
            };

            const data = await Promotions.find(filter);
            const total = await Promotions.count();

            return RESTUtils.buildResponse(data, limitQuery, (params.page) ? params.page : page, total);

        } catch (error) {
            console.error(error);
            throw RESTUtils.getServerErrorResponse(ERROR_GENERIC);
        }
    }


    /**
   *
   * @param {object} ctx
   * @param {object} options
   * @param {Function(Error, object)} callback
   *
   *
   */
    Promotions.prototype.updatePromotion = async (ctx) => {
        try {
            const { fields, files } = await multipartyParser.parse(ctx.req);
            const { id } = ctx.req.params;
            const data = JSON.parse(fields.all);
            const promotion = await Promotions.findById(id);
            promotion.updateAttributes(data);
            await shouldRemoveFiles(fields, promotion);
            await Promise.all([
                createContainerIfNotExists(IMAGES_CONTAINER),
                imageSaver.saveImages(files.imageToSave, promotion),
            ]);

            return RESTUtils.buildSuccessResponse({ data: PROMOTION_UPDATE_SUCCESS });
        } catch (error) {
            console.log("error", error);
            throw RESTUtils.getServerErrorResponse(error.message ? ERROR_GENERIC : error);
        }
    };


    /**
     * To create banner by form
     * @param {object} params data for search
     * @param {Function(Error, object)} callback
    */

    Promotions.remoteMethod('createPromotion', {
        accepts: { arg: 'params', type: 'object', "required": false, "description": "all object data", "http": { "source": "context" } },
        returns: { arg: "response", type: "object", root: false, description: "response data of service" },
        description: "To create promotions by form",
        http: {
            verb: 'post'
        },
    });

    Promotions.createPromotion = async function (ctx) {
        try {
            const { fields, files } = await multipartyParser.parse(ctx.req);
            const data = JSON.parse(fields.all);
            const { quantity } = data;
            const promotion = await Promotions.create(data);
            await shouldRemoveFiles(fields, promotion);
            await Promise.all([
                createContainerIfNotExists(IMAGES_CONTAINER),
                imageSaver.saveImages(files.imageToSave, promotion),
                addQuantitytoPromotion(quantity, promotion.id)
            ]);

            return RESTUtils.buildSuccessResponse({ data: PROMOTION_CREATE_SUCCESS });

        } catch (error) {
            console.log("error", error);
            throw RESTUtils.getServerErrorResponse(error.message ? ERROR_GENERIC : error);
        }

    }


    /**
     * To create banner by form
     * @param {object} params data for search
     * @param {Function(Error, object)} callback
    */

    Promotions.remoteMethod('getTopPromotions', {
        accepts: [
            { arg: 'req', type: 'object', http: { source: 'req' } },

        ],
        returns: {
            type: 'object',
            root: true,
            description: 'response data of service'
        },
        description: 'get top of promotions',
        http: {
            verb: 'get'
        },
    });

    Promotions.getTopPromotions = async function (req) {
        const top = 3; //Numero de promociones a mostrar..
        let where = {};
        const today = new Date()
        today.setHours('00', '00', '00', '00')
        where.start_date = { 'lte': today }
        where.end_date = { 'gte': today }
        try {
            const filter = {
                where: where,
                include: ['assets', 'inventory']
            };

            let data = await getEnablePromotions(filter);

            if (data.length > top) {
                data = getMostSalePromotions(data, top)
            }

            return RESTUtils.buildSuccessResponse({ data });

        } catch (error) {
            console.log("error", error);
            throw RESTUtils.getServerErrorResponse(error.message ? ERROR_GENERIC : error);
        }

    }

    Promotions.prototype.sufixForFileName = (promotion) => {
        return promotion.id
    }

    Promotions.prototype.updateImageFileName = async (entity, fileNames) => {
        const assets = Promotions.app.models.Assets;
        const promises = fileNames.map(file => {
            return assets.create({ promotionsId: entity.id, name: file })
        });
        await Promise.all(promises);
    }

    Promotions.downloadImage = (ctx, callback) => {
        Promotions.app.models.Image.download(IMAGES_CONTAINER, ctx.req.query.filename, ctx.req, ctx.res, err => {
            if (err) callback(err);
        });
    };

    const createContainerIfNotExists = async (containerName) => {
        const storage = Promotions.app.models.Image;
        storage.getContainers((err, containers) => {
            if (!containers.includes(containerName)) {
                storage.createContainer({ name: containerName }, function (err, c) { });
            }
        });
    };

    const shouldRemoveFiles = async (fields, promotion) => {
        const toRemoveFiles = fields["imagesToRemove"];
        if (toRemoveFiles) {
            await _deleteImages(toRemoveFiles, promotion)
        }
    }

    const _deleteImages = async (filesToRemove, promotion) => {
        const toRemove = filesToRemove || [];
        const assets = Promotions.app.models.Assets;

        await toRemove.forEach(fileName => {
            Promotions.app.models.Image.removeFile(IMAGES_CONTAINER, fileName, (err) => {
                if (err) {
                    return Promise.reject(err);
                }
            })
        });
        //console.log(filesToRemove, 'para eliminar', promotion);        
        const promises = toRemove.map(file => assets.destroyAll({ name: file }));
        await Promise.all(promises);

    };

    const addQuantitytoPromotion = async (quantity, promotionsId) => {
        const inventory = Promotions.app.models.Inventory;
        const now = new Date();
        const data = {
            quantity: quantity,
            promotionsId: promotionsId,
            type: 1,
            created: now,
            usersId: 1
        }
        return inventory.create(data);
    }

    const getEnablePromotions = async (filter) => {
        const data = await Promotions.find(filter);
        const result = [];

        await data.forEach(promotion => {
            let quantity = 0;
            let sales = 0;
            if (promotion.inventory().length) {
                promotion.inventory().forEach(item => {
                    if (item.type == 1) {
                        quantity = quantity + parseInt(item.quantity);
                    } else {
                        quantity = quantity - parseInt(item.quantity);
                        sales = sales + parseInt(item.quantity);
                    }
                });
            }
            if (quantity) {
                promotion.total = quantity;
                promotion.totalSale = sales;
                result.push(promotion);
            }
        });

        return result;
    }

    const getMostSalePromotions = (data, top) => {
        return data.sort((a, b) => (a.totalSale < b.totalSale) ? 1 : ((b.totalSale < a.totalSale) ? -1 : 0)).slice(0, top);
    }
};