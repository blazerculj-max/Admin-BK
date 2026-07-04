import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AdminApp from './AdminApp.jsx'
import ClientApp from './ClientApp.jsx'

const path = window.location.pathname

let Component = App
if(path.startsWith('/admin')) Component = AdminApp
if(path.startsWith('/oddaj')) Component = ClientApp

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>,
)
