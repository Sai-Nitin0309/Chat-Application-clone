
import { createRoot } from "react-dom/client"
import App from './App';
import "./style.css"
import { Provider } from "react-redux";
import { store } from "./store";
import { IkagoProvider } from "ikago";
import { DB_NAME, DB_VERSION, DB_SCHEMA } from "./services/ikagoDb";

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <IkagoProvider dbName={DB_NAME} version={DB_VERSION} schema={DB_SCHEMA}>
      <App />
    </IkagoProvider>
  </Provider>
)
