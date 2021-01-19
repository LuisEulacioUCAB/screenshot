const captureWebsite = require('capture-website');
const wait = require("wait");
const moment = require("moment");
require('dotenv').config()
const sendgrid = require('@sendgrid/mail');
const fs = require("fs");

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

const take_screenshot = async () => {
    const date = moment().format("YYYY_MM_DD_H_m_s");
    const file = `${process.env.FOLDER_FILES}/${process.env.FILE_NAME}-${date}.${process.env.EXTENSION}`;
    let captureWebsiteFile;
    try{
        captureWebsiteFile = await captureWebsite.file(process.env.URL_SITE, file,{
            fullPage: true,
            beforeScreenshot: async (page, browser) => {
                await page.evaluate((_) => {
                    window.scrollBy({
                        top: 800,
                        behavior: "smooth",
                    });
                });
                await wait(20000);

                await page.evaluate((_) => {
                    window.scrollBy({
                        top: 30000,
                        behavior: "smooth",
                    });
                });

// Another arbitrary wait to allow more things to load
                await wait(20000);

// Scroll back to top
                await page.evaluate((_) => {
                    window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                    });
                });
            }
        },{
            launchOptions: {
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
            }
        });
    }catch (error){
        console.log('take_screenshot:error', JSON.stringify(error, null, 2));
        return error
    }

    sendEmail(file);

};

//take_screenshot();

const sendEmail = async (file) =>{
    const attachment = fs.readFileSync(file).toString("base64");
    const senderEmails = process.env.SENDGRID_TO_EMAIL.split(",");
    const data = {
        to: senderEmails, // Change to your recipient
        from: process.env.SENDGRID_FROM_EMAIL, // Change to your verified sender
        template_id: process.env.SENDGRID_TEMPLATE_ID,
        attachments: [
            {
                content: attachment,
                filename: file,
                type: "application/png",
                disposition: "attachment"
            }
        ],
        dynamicTemplateData: {
            body:process.env.SENDGRID_BODY,
            subject: process.env.SENDGRID_SUBJECT
        },
    }


    try {
        await sendgrid.send(data);
    }catch (e){
        console.log('variables', JSON.stringify(e, null, 2));
    }
}

take_screenshot();



