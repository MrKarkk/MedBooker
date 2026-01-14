import { Outlet } from 'react-router-dom';


const LayoutQueue = () => {
    return (
        <div className="app-queue">
            <main className="main-content-queue">
                <Outlet />
            </main>
        </div>
    );
};

export default LayoutQueue;
