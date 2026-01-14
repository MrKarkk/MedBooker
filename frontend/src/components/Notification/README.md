# Компонент Notification

Универсальная система уведомлений в премиум-стиле для MedBooker.

## Использование

### 1. Базовое использование с хуком

```jsx
import { useNotification } from '../../components/Notification/useNotification';
import NotificationContainer from '../../components/Notification/NotificationContainer';

function MyComponent() {
  const { notifications, success, error, loading, hide, removeNotification } = useNotification();

  const handleSuccess = () => {
    success('Запись успешно создана!');
  };

  const handleError = () => {
    error('Произошла ошибка при сохранении');
  };

  const handleLoading = () => {
    const loadingId = loading('Загрузка данных...');
    
    // Когда загрузка завершится:
    setTimeout(() => {
      hide(loadingId);
      success('Данные загружены!');
    }, 2000);
  };

  return (
    <>
      <button onClick={handleSuccess}>Успех</button>
      <button onClick={handleError}>Ошибка</button>
      <button onClick={handleLoading}>Загрузка</button>
      
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </>
  );
}
```

### 2. Прямое использование компонента

```jsx
import Notification from '../../components/Notification/Notification';

function MyComponent() {
  const [show, setShow] = useState(false);

  return (
    <>
      <button onClick={() => setShow(true)}>Показать уведомление</button>
      
      {show && (
        <Notification
          type="success"
          message="Операция выполнена успешно!"
          onClose={() => setShow(false)}
          duration={3000}
        />
      )}
    </>
  );
}
```

## Типы уведомлений

- **success** - зелёное уведомление с галочкой ✓
- **error** - красное уведомление с крестиком ✕
- **loading** - золотое уведомление с анимацией загрузки

## Параметры

### Notification
- `type` - тип уведомления ('success', 'error', 'loading')
- `message` - текст сообщения
- `onClose` - функция закрытия
- `duration` - длительность показа в мс (по умолчанию 4000)

### useNotification
- `success(message, duration?)` - показать успех
- `error(message, duration?)` - показать ошибку
- `loading(message)` - показать загрузку (возвращает ID)
- `hide(id)` - скрыть уведомление по ID
- `notifications` - массив активных уведомлений

## Примеры использования

### В форме записи
```jsx
const { notifications, success, error, loading, hide, removeNotification } = useNotification();

const handleSubmit = async (e) => {
  e.preventDefault();
  const loadingId = loading('Отправка данных...');
  
  try {
    await api.createAppointment(data);
    hide(loadingId);
    success('Запись создана! Ожидайте подтверждения.');
  } catch (err) {
    hide(loadingId);
    error('Не удалось создать запись. Попробуйте снова.');
  }
};

return (
  <>
    <form onSubmit={handleSubmit}>...</form>
    <NotificationContainer notifications={notifications} onRemove={removeNotification} />
  </>
);
```

### В процессе загрузки данных
```jsx
useEffect(() => {
  const loadingId = loading('Загрузка списка врачей...');
  
  fetchDoctors()
    .then(() => {
      hide(loadingId);
      success('Врачи загружены');
    })
    .catch(() => {
      hide(loadingId);
      error('Ошибка загрузки');
    });
}, []);
```
