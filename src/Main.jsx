
import { createRoot } from "react-dom/client"
import App from './App';
import "./style.css"
import { Provider } from "react-redux";
import { store } from "./store";

console.log(App);

createRoot(document.getElementById('root')).render(<Provider store={store}>
    <App></App>
</Provider>)
