(async () => {
  try {
    const { create } = await import('ipfs-http-client');

    const ipfs = create({
      host: '127.0.0.1',
      port: 5001,
      protocol: 'http'
    });

    const result = await ipfs.add('hello world');

    console.log('SUCCESS');
    console.log(result.cid.toString());

  } catch (err) {
    console.error('FAILED');
    console.error(err);
  }
})();
