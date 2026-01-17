export default function InfoModal({ title, msg, onClose }) {
  return (
    <div className="overlay">
      <div className="modal-box">
        <h3 className="text-cyan">{title}</h3>
        <p style={{ margin: '20px 0', fontSize: '1.1rem' }}>{msg}</p>
        <button className="btn-main" onClick={onClose}>SUPER</button>
      </div>
    </div>
  );
}