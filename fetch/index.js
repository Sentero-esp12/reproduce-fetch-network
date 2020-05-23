
console.log = console.info; //console.log doesn't work in a chrome debugging instance

const { app, BrowserWindow } = require('electron')
/* const electron = require('electron') */
function createWindow() {

   const win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
         nodeIntegration: true
      }
   })

   win.loadURL('https://example.com')
   win.webContents.openDevTools()

   try {
      win.webContents.debugger.attach('1.3')
   } catch (err) {
      console.log('Debugger attach failed : ', err)
   }

   win.webContents.debugger.on('detach', (event, reason) => {
      console.log('Debugger detached due to : ', reason)
   })

   win.webContents.debugger.sendCommand("Fetch.enable",
      {
         patterns: [{
            requestStage: "Response",
            resourceType: "Document", urlPattern: '*example*'
         }]
      }, (e) => {
         console.log('fetch enabled')
      })

   const fullfillRequest = (encodedHTML, params) => {
      win.webContents.debugger.sendCommand("Fetch.fulfillRequest",
         {
            requestId: params.requestId,
            responseCode: params.responseStatusCode,
            body: encodedHTML
         },
         function (e) {
            console.log(e)
         });
   }

   win.webContents.debugger.on('message', (event, method, params, resourceType) => {
      if (method === "Fetch.requestPaused") {   //request paused and ready to be intercepted
         console.log(method, params, resourceType, params.request.url)
//it stops here and never returns the response body
         win.webContents.debugger.sendCommand("Fetch.getResponseBody",
            { requestId: params.requestId }, (body, base64) => {
               console.log(body, 'got Response and modifying it')
               let encodedHTML = body.body;
               let decoded = atob(body.body)


               if (decoded.indexOf(`http-equiv="Content-type"`) !== -1) {
                  let indexMetaContent = decoded.indexOf('<meta http-equiv="Content-type');
                  let endMetaContent = decoded.indexOf('<', indexMetaContent + 1);
                  let finalHTML = `
            ${decoded.substr(0, indexMetaContent)}
            ${decoded.substr(endMetaContent)}`
                  console.log(finalHTML);
                  encodedHTML = btoa(finalHTML);

                  fullfillRequest(encodedHTML, params)
               }
               else {
                  //if no Content-type found, send an unmodified request: 
                  fullfillRequest(encodedHTML, params)
               }
            })


      }
   })

}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
   if (process.platform !== 'darwin') {
      app.quit()
   }
})

app.on('activate', () => {
   if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
   }
})


