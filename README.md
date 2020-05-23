# reproduceFetchNetwork
 Reproduces Network and Fetch not receiving the response body


 I've created two electron mini-apps to to show the issue. 
 The one in the Fetch folder is using Fetch: https://chromedevtools.github.io/devtools-protocol/tot/Fetch/
 The one in the Network folder is using Network: https://chromedevtools.github.io/devtools-protocol/tot/Network/

 They get stuck on the line
 ```
win.webContents.debugger.sendCommand("Fetch.getResponseBody",
            { requestId: params.requestId }, (body, base64) => {
 ```
 or
 ```
 win.webContents.debugger.sendCommand('Network.getResponseBody', { requestId: params.requestId }, (body, body64) => {
 ```

 And nothing gets returned in the callback

 

