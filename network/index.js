console.log = console.info; //console.log doesn't work in a chrome debugging instance
const { app, BrowserWindow } = require('electron')
function createWindow() {

   const win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
         nodeIntegration: true
      }
   })

   win.loadURL('http://example.com')
   win.webContents.openDevTools()

   try {
      win.webContents.debugger.attach('1.3')
   } catch (err) {
      console.log('Debugger attach failed : ', err)
   }

   win.webContents.debugger.on('detach', (event, reason) => {
      console.log('Debugger detached due to : ', reason)
   })

   function fullfillRequest(encodedHTML, params) {
      win.webContents.debugger.sendCommand("Fetch.fulfillRequest", 
      //not sure if Fetch can be used but Network.continueInterceptedRequest is deprecated
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
      if (method === 'Network.requestWillBeSent') {
         if (params.type === 'Document') {
            console.log('document', params, params.requestId)
            win.webContents.debugger.sendCommand('Network.getResponseBody', { requestId: params.requestId }, (body, body64) => {
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
            })

         }
      }
   })

   win.webContents.debugger.sendCommand('Network.enable')


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


