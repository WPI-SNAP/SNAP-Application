module.exports = {
    development: {
        passport: {
            strategy: 'saml',
            saml: {
                path: process.env.SAML_PATH || '/login/callback',
                entryPoint: process.env.SAML_ENTRY_POINT || 'https://openidp.feide.no/simplesaml/saml2/idp/SSOService.php',
                issuer: 'passport-saml',
                //TODO: Figure out cert info
            }
        }
    }
};