'use strict';
const RESTUtils = require('../utils/RESTUtils');
const ERROR_GENERIC = 'Error conexion con el servidor'
const CodeGenerator = require('../utils/CodeGenerator');
const sendEmail = require('../utils/sendEmail');
const config = require('../../server/config.json');
const ERROR_USER_DONT_EXIST = "Error, El usuario no existe en el sistema";
const ERROR_USER_DISABLED = "Error, El usuario no se encuentra activo.";


module.exports = function(Usuario) {

    const superLogin = Usuario.login;

    /**
     * To search tranport by one requerimient
     * @param {object} params data for search
     * @param {Function(Error, object)} callback
     */

    Usuario.remoteMethod('createUser', {
        accepts: [            
            { arg: 'params', type: 'object', 'description': 'create user', 'http': { 'source': 'body' } },

        ],
        returns: {
            type: 'object',
            root: true,
            description: 'response data of service'
        },
        description: 'create user',
        http: {
            verb: 'post'
        },
    });

    Usuario.createUser = async function (params) {        
        let response = { message: '', status: '200' }
        try {
            if(params.id){
                const user = await Usuario.findById( params.id );
                if(user){
                    const emailExists = await Usuario.findOne({ where:{email:params.email}});                    
                    if( !emailExists || (emailExists && params.id == emailExists.id) ){
                        await user.updateAttributes(params);
                        response.message= 'El usuario se actualizo correctamente.'
                    }else{
                        response.message = "Error, El email ya existe por favor ingrese uno diferente.";
                        response.status = 434;  
                    }
                }
            }else{
                const [userExists, emailExists ] = await Promise.all([
                    Usuario.findOne({ where: {username:params.username}}),
                    Usuario.findOne({ where:{email:params.email}})
                ]);

                if( !userExists ){                
                    if( !emailExists ){
                        params.activeCode = await CodeGenerator.generateCode(10); //Codigo para la activacin del correo.
                        const userCreated = await Usuario.create(params);                    
                        await sendConfirmationEmail(userCreated);
                        
                        response.message = "El usuario se creo satisfactoriamente. Se ha enviado un correo para la confirmacion de la cuenta al email registrado.";                    
                    }else{
                        response.message = "Error, El email ya existe por favor ingrese uno diferente.";
                        response.status = 434;    
                    }
                    
                }else{
                    response.message = "Error, El usuario ya existe por favor ingrese uno diferente.";
                    response.status = 433;
                }
            }

            return response;

        } catch (error) {     
            console.log(error);                   
            return error            
        }        
    }


    Usuario.remoteMethod('checkCode', {
        accepts: [            
            { arg: 'params', type: 'object', 'description': 'check code and enabled user', 'http': { 'source': 'body' } },

        ],
        returns: {
            type: 'object',
            root: true,
            description: 'response data of service'
        },
        description: 'create user',
        http: {
            verb: 'post'
        },
    });

    Usuario.checkCode = async function (params) {        
        let message = 'La url no existe por favor validar la informacion con el Administrador del sitio';

        try {           
            const user = await Usuario.findOne({where:{activeCode:params.code}});    

            if(user){
                message = 'El usuario ya se encuentra activo';
                if(!user.active){
                    const updateData = { active:true };
                    await user.updateAttributes(updateData);
                    message = 'El usuario se activo correctamente.';
                }
            }

            return RESTUtils.buildSuccessResponse({data:message});       
        } catch (error) {     
            console.log(error);                   
            return error            
        }        
    }

    /**
     * To send email a user and recorver password
     * @param {object} params data for search
     * @param {Function(Error, object)} callback
     */  

    Usuario.remoteMethod('emailToRecoverUser', {
        accepts: [
            { arg: 'params', type: 'object',"required": true, "description": "all object data", "http": {"source": "body"}},
        ],
        returns: { arg: 'response', type: 'object', root: true, description: 'response data' },        
        description: 'to send email for recover password.',
    });

    Usuario.emailToRecoverUser = async function (params) {  
        let user, message
        let response = {success:true, message:''}
        try {
            user = await Usuario.findOne({where:{email:params.email}});                      
            if(!user){
                response.message = 'El correo ingresado no se encuentra en el sistema.';                     
                response.success = false
            }else{
                const codeEmail = await CodeGenerator.generateCode(10); 
                const updateData = { recoverCode:codeEmail };
                if(await user.updateAttributes(updateData)){               
                    response.message = 'Se envio un correo con las intrucciones para recuperar la contraseña';                    
                    await sendRecoverEmail({ username:user.username, email:user.email, codeUrl:codeEmail});
                }
            }            
            return response;

        } catch (error) {
            console.log(error);                   
            return error 
        } 
        
    }

       /**
     * To login user
     * @param {object} params data for search
     * @param {Function(Error, object)} callback
     */  

    Usuario.remoteMethod('login', {
        accepts: [
            { arg: 'params', type: 'object',"required": true, "description": "all object data", "http": {"source": "body"}},
        ],
        returns: { arg: 'response', type: 'object', root: true, description: 'response data' },
        http: { verb: 'post', path: '/login' },
        description: 'To Login in the app',
    });

    Usuario.login = async function (params) {        
        let login , user;
        user = await Usuario.findOne({where:{username:params.username}});        
        
        if(!user) {
            throw RESTUtils.getUnauthorizedErrorResponse(ERROR_USER_DONT_EXIST);                
        } else if( !user.active ){
            throw RESTUtils.getUnauthorizedErrorResponse(ERROR_USER_DISABLED);                
        } else{
            login = await superLogin.call( Usuario, params);
        }
        
        return { ...login.__data, user:user };        
        
    }   
    
    
    /**
     * To send email a user and recorver password
     * @param {object} params data for search
     * @param {Function(Error, object)} callback
     */  

    Usuario.remoteMethod('changePasswordUser', {
        accepts: [
            { arg: 'params', type: 'object',"required": true, "description": "all object data", "http": {"source": "body"}},
        ],
        returns: { arg: 'response', type: 'object', root: true, description: 'response data' },        
        description: 'to send email for recover password.',
    });

    Usuario.changePasswordUser = async function (params) {        
        let user, message
        let response = { message:'', success:true }        
        try {
            user = await Usuario.findOne({where:{recoverCode:params.recoverCode}});        
            if(!user){
                response.message = 'El codigo de recuperacion no ha sido asignado a ningun usuario.';                
                response.success = false;
            }else{                 
                const updateData = { password:params.password, recoverCode:null };
                if(await user.updateAttributes(updateData)){               
                    response.message = 'Se actualizo la contraseña del usuario.';
                    //await sendRecoverEmail({email:params.email, codeUrl:codeEmail});
                }
            }            
            return response;
        } catch (error) {
            console.log(error);                   
            return error 
        } 
        
    }

    /**
     * To search tranport by one requerimient
     * @param {object} params data for search
     * @param {Function(Error, object)} callback
     */

    Usuario.remoteMethod('search', {
        accepts: [
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'params', type: 'object', 'description': 'all object data', 'http': { 'source': 'body' } },

        ],
        returns: {
            type: 'object',
            root: true,
            description: 'response data of service'
        },
        description: 'Post current users',
        http: {
            verb: 'post'
        },
    });

    Usuario.search = async function (req, params) {
        let limitQuery = (params.pageSize) ? params.pageSize : 10;
        let page = (params.page) ? ((params.page - 1) * limitQuery) : 0;                
        
        try {
            const filter = {                
                limit: limitQuery,
                skip: page,
                include: ['Role']
            };
            
            const [ data, total ] = await Promise.all([
                Usuario.find(filter),
                Usuario.count()
            ])

            return RESTUtils.buildResponse(data, limitQuery, (params.page) ? params.page : page, total);

        } catch (error) {
            console.error(error);
            throw RESTUtils.getServerErrorResponse(ERROR_GENERIC);
        }
    }

    Usuario.remoteMethod('getUser', {
        accepts: [
            { arg: 'req', type: 'object', http: { source: 'req' } },
            { arg: 'params', type: 'object', 'description': 'all object data', 'http': { 'source': 'body' } },

        ],
        returns: {
            type: 'object',
            root: true,
            description: 'response data of service'
        },
        description: 'Post current users',
        http: {
            verb: 'post'
        },
    });

    Usuario.getUser = async function (req, params) {
        try {

            const user = await Usuario.findOne({where:{id:params.userId}, include:['Role']});         

            return RESTUtils.buildSuccessResponse({data:user});       
        } catch (error) {
            console.error(error);
            throw RESTUtils.getServerErrorResponse(ERROR_GENERIC);
        }
    }

    const sendConfirmationEmail = async (user) => {
        const params = {
            fullName : `${user.name} ${user.lastname}`,
            urlConfirmation: `${config.appUrl}/confirmationUser?code=${user.activeCode}`,            
            email:user.email
        }

        return sendEmail.sendConfirmationEmail(params);        
    }

    const sendRecoverEmail = async (data) => {
        const params = {            
            urlRecover: `${config.appUrl}/resetPassword?code=${data.codeUrl}`,            
            ...data
        }

        return sendEmail.sendRecoverEmail(params);        
    }   


    
};
