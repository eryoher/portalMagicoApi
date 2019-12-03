'use strict';

const fs = require('fs');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const config = require('../../server/config.json');
const MaskImp = require('mask-imp');
const configSmtp = config.configSMTP;

const sendBuyPromotionEmail = ( params ) => {        
    const transport = nodemailer.createTransport(configSmtp);    
    
    readHTMLFile(__dirname + '/../../common/templates/template_buy_promotion_email.html', function(err, html) {    
        const pattern = "#.###";
        const options = { reverse: true };
        const mask = MaskImp(pattern, options);    

        let template = handlebars.compile(html);            
        const discount = parseFloat( params.promotion.discount / 100 );
        const finalprice = parseFloat( params.promotion.price - parseFloat( params.promotion.price * discount ) );
        const replacements = {
            fullName: params.last_name,
            code: params.code,
            discount:params.promotion.discount,
            promotion:params.promotion.name,
            company:params.promotion.company.name, 
            productprice:mask.masked(params.promotion.price),
            finalprice: mask.masked(finalprice)
        };

        const htmlToSend = template(replacements);          
         
        transport.sendMail({
            from: 'servicioalcliente@fundacionportalmagico.org',
            to: params.email,
            subject: `Detalles de tu donacion ${params.first_name}`,            
            html: htmlToSend
        }, function (er) {
            if (er) console.error(er)
        });
    }); 
    
}


const sendConfirmationEmail = ( params ) => {    
    const transport = nodemailer.createTransport(configSmtp);        
    readHTMLFile(__dirname + '/../../common/templates/template_confirmation_email.html', function(err, html) {            
        let template = handlebars.compile(html);            

        const replacements = {
            fullName: params.fullName,
            urlConfirmation: params.urlConfirmation
        };

        const htmlToSend = template(replacements);          
         
        transport.sendMail({
            from: 'servicioalcliente@fundacionportalmagico.org',
            to: params.email,
            subject: 'Confirmación subscripción.',            
            html: htmlToSend
        }, function (er) {
            if (er) console.error(er)
        });
    });      
    
}

const sendRecoverEmail = ( params ) => {    
    const transport = nodemailer.createTransport(configSmtp);        
    readHTMLFile(__dirname + '/../../common/templates/template_recover_password.html', function(err, html) {            
        let template = handlebars.compile(html);            

        const replacements = {            
            urlConfirmation: params.urlRecover,
            username:params.username
        };

        const htmlToSend = template(replacements);          
         
        transport.sendMail({
            from: 'servicioalcliente@fundacionportalmagico.org',
            to: params.email,
            subject: 'Recuperacion de contraseña',            
            html: htmlToSend
        }, function (er) {
            if (er) console.error(er)
        });
    });      
    
}

const readHTMLFile = function(path, callback) {
    fs.readFile(path, {encoding: 'utf-8'}, function (error, html) {
        if (error) {
            console.log(error);                
            throw error;
        }
        else {
            callback(null, html);
        }
    });
};

module.exports = {
    sendConfirmationEmail,  
    sendBuyPromotionEmail, 
    sendRecoverEmail 
};
