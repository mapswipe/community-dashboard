import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { _cs } from '@togglecorp/fujs';

import ItemSelectInput, { SearchItemType } from '#components/ItemSelectInput';
import mapSwipeLogo from '#resources/img/logo.svg';

import styles from './styles.module.css';

interface Props {
    className?: string;
}

function Navbar(props: Props) {
    const { className } = props;

    const navigate = useNavigate();

    // FIXME: use route.path
    const handleSelectItem = useCallback((item: SearchItemType | undefined) => {
        if (item) {
            navigate(`/${item.type}/${item.id}/`);
        }
    }, [navigate]);

    return (
        <nav className={_cs(className, styles.navbar)}>
            <div className={styles.container}>
                <div className={styles.navLinks}>
                    <a
                        href={import.meta.env.REACT_APP_MAPSWIPE_WEBSITE ?? 'https://mapswipe.org'}
                        className={styles.link}
                    >
                        <div className={styles.appBrand}>
                            <img
                                className={styles.logo}
                                src={mapSwipeLogo}
                                alt="MapSwipe"
                            />
                        </div>
                    </a>
                </div>
                <ItemSelectInput
                    className={styles.filter}
                    placeholder="Search Users and Groups"
                    onItemSelect={handleSelectItem}
                    labelContainerClassName={styles.label}
                />
            </div>
        </nav>
    );
}

export default Navbar;
