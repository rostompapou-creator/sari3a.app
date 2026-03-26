import Image from "next/image"
import logoImage from "../logosari3a.png"

export function Sari3aLogo({ compact = false }) {
  return (
    <div className={`brand-mark ${compact ? "compact" : ""}`}>
      <div className={`brand-logo-frame ${compact ? "compact" : ""}`}>
        <Image src={logoImage} alt="Logo Sari3a" priority={compact ? false : true} className="brand-logo-image" />
      </div>
      <div>
        <div className="brand-title">
          SARI<span>3</span>A
        </div>
      </div>
    </div>
  )
}
