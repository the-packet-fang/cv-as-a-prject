function whichBrowser(agent) {
    //agent needed (window.navigator.userAgent);

    var browserName;
    switch (true) {
        case agent.toLowerCase().indexOf("edge") > -1:
            browserName = "MS Edge";
            break;
        case agent.toLowerCase().indexOf("edg/") > -1:
            browserName = "Edge ( chromium based)";
            break;
        case agent.toLowerCase().indexOf("opr") > -1 && !!window.opr:
            browserName = "Opera";
            break;
        case agent.toLowerCase().indexOf("chrome") > -1 && !!window.chrome:
            browserName = "Chrome";
            break;
        case agent.toLowerCase().indexOf("trident") > -1:
            browserName = "MS IE";
            break;
        case agent.toLowerCase().indexOf("firefox") > -1:
            browserName = "Mozilla Firefox";
            break;
        case agent.toLowerCase().indexOf("safari") > -1:
            browserName = "Safari";
            break;
        default:
            browserName = "other";
    }
    return browserName;
}
function pushData() {
    let browser = whichBrowser(window.navigator.userAgent);
    let rawdata;

    // change synchronous calls
    $.ajaxSetup({ async: false });
    $.getJSON("https://api.db-ip.com/v2/free/self", function (result) {
        rawdata = result;
    });

    let success;
    try {
        var message = {
            ipAddress: rawdata.ipAddress,
            countryName: rawdata.countryName,
            city: rawdata.city,
            browser: browser,
        };
        success = true;
    } catch (e) {
        success = false;
        console.log(e);
    }
    if (success == false) {
        message = {
            ipAddress: "empty",
            countryName: "empty",
            city: "empty",
            browser: browser,
        };
        console.log("error fetching data. Please disable your ad blocker");
    }

    $.ajax({
        async: false,
        url: "https://4em1xp5e0l.execute-api.eu-west-2.amazonaws.com/visitors",
        headers: {},
        crossDomain: true,
        type: "GET"
    });
    $.ajax({
        async: false,
        url: "https://4em1xp5e0l.execute-api.eu-west-2.amazonaws.com/take_data",
        headers: {},
        crossDomain: true,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(message)
        });
}
