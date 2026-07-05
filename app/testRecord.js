const fabricService = require('./services/fabricService');

(async () => {
    try {
        const record = await fabricService.getData(
            'aditi-student-circular-pdc-2026-1782654083810'
        );

        console.log(JSON.stringify(record, null, 2));
    } catch (err) {
        console.error(err);
    }
})();
