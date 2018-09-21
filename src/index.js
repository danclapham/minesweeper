import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

/*
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';

import blue from '@material-ui/core/colors/blue';
import red from '@material-ui/core/colors/red';

const theme = createMuiTheme({
    palette: {
        primary: blue,
        secondary: red,
    }
})
*/

ReactDOM.render(
    //<MuiThemeProvider theme={theme}>
        <App />,
    //</MuiThemeProvider>,        
    document.getElementById('root')
);
registerServiceWorker();
