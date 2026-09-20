import './Spinner.css'

export default function Spinner({ size = 20, color }) {
  return (
    <span 
      className="spinner" 
      style={{ 
        width: size, 
        height: size,
        ...(color ? { borderTopColor: color } : {})
      }} 
      role="status"
      aria-label="Loading..."
    />
  )
}