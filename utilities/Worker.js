function orderByKeys(items, elements) {

    // Create a lookup object for keys in the items array
    const keyLookup = new Map;
    for(const [item, index] of items){
        keyLookup.set(item.key, index);
    }

    // Sort the elements array based on the order of keys in the items array using the lookup map.
    elements.sort((a, b) => keyLookup[a.key] - keyLookup[b.key]);

    //elements.sort((a, b) => keyLookup[a.key].localeCompare(keyLookup[b.key]));
    return elements;
}

self.onmessage = (event) => {
    console.log("Message received from main script", event.data);
    self.postMessage(event.data);
};
