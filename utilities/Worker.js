self.onmessage = (event) => {
    console.log("Message received from main script", event.data);
    self.postMessage(event.data);
};
