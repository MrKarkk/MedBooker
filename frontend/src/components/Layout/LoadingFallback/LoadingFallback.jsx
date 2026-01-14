import './LoadingFallback.css';

const LoadingFallback = () => (
    <div className="loading-fallback">
        <div className="loading-spinner">
            <div className="spinner"></div>
        </div>
        <p className="loading-text">Загрузка...</p>
    </div>
);

export default LoadingFallback;
