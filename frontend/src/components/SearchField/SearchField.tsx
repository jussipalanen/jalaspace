import { useId } from 'react'
import { SearchIcon } from '../icons'
import './SearchField.css'

interface SearchFieldProps {
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

export function SearchField({ label, placeholder, value, onChange }: SearchFieldProps) {
  const id = useId()
  return (
    <div className="search-field">
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <SearchIcon className="search-field__icon" width={18} height={18} />
      <input
        id={id}
        type="search"
        className="field__input search-field__input"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
      />
    </div>
  )
}
