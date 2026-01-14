import { Link } from "react-router-dom";

const ButtonAppointment = ({ link, text }) => {
    return (
        <Link to={`/${link}`} className="btn-one" style={{ textDecoration: 'none', display: 'inline-block' }}>
            {text}
        </Link>
    );
}

export default ButtonAppointment;