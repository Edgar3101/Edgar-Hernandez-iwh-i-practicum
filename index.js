const express = require('express');
const axios = require('axios');
const app = express();

// We load our environment variables from the .env file 
require('dotenv').config();


app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// * Please DO NOT INCLUDE the private app access token in your repo. Don't do this practicum in your normal account.
// Constans Required for the HubSpot API
const PRIVATE_APP_ACCESS = process.env.PRIVATE_APP_ACCESS;
const HUBSPOT_OBJECT_ID= "2-42357121";
// Cache the options for the custom object property, we dont have a database to store this data.
const measure_cached_options= [];
// If the private app access token is not set, we will log an error and exit the application.
if (!PRIVATE_APP_ACCESS) {
    console.error('Please set the PRIVATE_APP_ACCESS environment variable.');
    process.exit(1);
}

/**
 * Fetches and caches measure options for a specific HubSpot object property.
 * 
 * This function retrieves the options for the "time_measure" property of a HubSpot object
 * using the HubSpot CRM API. If the options are already cached, it returns the cached options.
 * Otherwise, it fetches the options from the API, caches them, and then returns them.
 * 
 * @function
 * @returns {Promise<string[]>} A promise that resolves to an array of measure option values.
 * @throws {Error} Logs an error to the console if the API request fails.
 */
async function getMeasureOptions(){
    if(!measure_cached_options.length){
        const url= `https://api.hubspot.com/crm/v3/properties/${HUBSPOT_OBJECT_ID}/time_measure`;
        const headers = {
            Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
            'Content-Type': 'application/json'
        }
        try {
            const resp = await axios.get(url, { headers });
            const data = resp.data;
            let measure_options= data.options.map((obj) => { return obj.value});
            measure_cached_options.push(...measure_options);
        } catch (error) {
            console.error(error)
        }
    }

    return measure_cached_options;
}

// TODO: ROUTE 1 - Create a new app.get route for the homepage to call your custom object data. Pass this data along to the front-end and create a new pug template in the views folder.
// * Code for Route 1 goes here
app.get("/update-cobj", async (req, res) => {
    const measure_options = await getMeasureOptions();
    return res.render('updates', { title: "Update Custom Object Form | Integrating With HubSpot I Practicum", options: measure_options });
});

// TODO: ROUTE 2 - Create a new app.get route for the form to create or update new custom object data. Send this data along in the next route.

// * Code for Route 2 goes here
app.post("/update-cobj", async(req, res) => {
    // First we need to get the data from the form, and also, check if the data is valid.
    let { name, institution,time_taken, time_measure } = req.body;
    // We check if the data is valid
    if(!name || !institution || !time_taken || !time_measure){
        const measure_options= await getMeasureOptions();
        return res.render('updates', { message: 'Please fill all the fields', options: measure_options });
    }
    // We trim the data to remove any extra spaces
    name= name.trim();
    institution= institution.trim();
    time_taken= time_taken.trim();
    // We create the URL and the headers for the request
    const url= `https://api.hubspot.com/crm/v3/objects/${HUBSPOT_OBJECT_ID}`;
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`, 
        'Content-Type': 'application/json'
    }
    try{
        const data= {
            properties: {
                name,
                institution,
                time_taken,
                time_measure
            }
        }
        const resp= await axios.post(url, data, { headers });
        return res.redirect('/');
    }catch(error){
        console.error(error);
        return res.render('error', { message: 'An error occurred while saving the data' });
    }
});
// TODO: ROUTE 3 - Create a new app.post route for the custom objects form to create or update your custom object data. Once executed, redirect the user to the homepage.

// * Code for Route 3 goes here
app.get('/', async (req, res) => {
    const url = `https://api.hubspot.com/crm/v3/objects/${HUBSPOT_OBJECT_ID}`;
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };
    
    const params = {
        limit: 100,
        properties: 'name,institution,time_taken,time_measure'
    };

    try {
        const resp = await axios.get(url, { headers, params });
        const degrees = resp.data.results;
        res.render('homepage', { title: 'Contacts | HubSpot APIs', degrees});      
    } catch (error) {
        console.error(error);
    }
})

/** 
* * This is sample code to give you a reference for how you should structure your calls. 

* * App.get sample
app.get('/contacts', async (req, res) => {
    const contacts = 'https://api.hubspot.com/crm/v3/objects/contacts';
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    }
    try {
        const resp = await axios.get(contacts, { headers });
        const data = resp.data.results;
        res.render('contacts', { title: 'Contacts | HubSpot APIs', data });      
    } catch (error) {
        console.error(error);
    }
});

* * App.post sample
app.post('/update', async (req, res) => {
    const update = {
        properties: {
            "favorite_book": req.body.newVal
        }
    }

    const email = req.query.email;
    const updateContact = `https://api.hubapi.com/crm/v3/objects/contacts/${email}?idProperty=email`;
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };

    try { 
        await axios.patch(updateContact, update, { headers } );
        res.redirect('back');
    } catch(err) {
        console.error(err);
    }

});
*/


// * Localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));