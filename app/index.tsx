import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import Base from './Base';

const webappRootId = 'app-container';
const webappRootElement = document.getElementById(webappRootId);

if (!webappRootElement) {
    // eslint-disable-next-line no-console
    console.error(`Could not find html element with id '${webappRootId}'`);
} else {
    ReactDOM.createRoot(webappRootElement).render(
        <StrictMode>
            <Base />
        </StrictMode>,
    );
}
