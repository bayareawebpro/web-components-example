addEventListener('message', event => {
    Promise.allSettled(event.data.execute())

    //self.append();
});