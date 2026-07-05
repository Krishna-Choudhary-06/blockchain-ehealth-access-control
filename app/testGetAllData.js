const fabricService = require('./services/fabricService');

(async () => {
    try {
        const data = await fabricService.getAllData();
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(err);
    }
})();
