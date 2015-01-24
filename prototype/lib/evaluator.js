onmessage = function(e) {
    var result = eval(e.data);
    var stringResult = {};

    for(var key in result) {
        if(result.hasOwnProperty(key)) {
            stringResult[key] = result[key].toString();
        }
    }

    postMessage(stringResult);
}
