"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Download, FileImage } from "lucide-react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface WinnerCardProps {
  winner: any
  fightColumn: string
  drawTime: Date // New prop for draw time
}

export function WinnerCard({ winner, fightColumn, drawTime }: WinnerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const exportAsPNG = async () => {
    if (cardRef.current) {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#ffffff", // Ensure white background for export
        scale: 2, // Increase scale for better resolution
        useCORS: true, // Enable CORS for images if hosted externally
      })

      const link = document.createElement("a")
      link.download = `KFL-Winner-${winner.UserName || winner.Username || "Winner"}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    }
  }

  const exportAsPDF = async () => {
    if (cardRef.current) {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#ffffff", // Ensure white background for export
        scale: 2, // Increase scale for better resolution
        useCORS: true, // Enable CORS for images if hosted externally
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("landscape", "mm", "a4") // A4 landscape dimensions
      const imgWidth = 280 // A4 width in mm (approx)
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight) // Add image with padding
      pdf.save(`KFL-Winner-${winner.UserName || winner.Username || "Winner"}.pdf`)
    }
  }

  const formattedDate = drawTime.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const formattedTime = drawTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="winner-card-bg p-8 rounded-2xl shadow-2xl text-black relative overflow-hidden border border-gray-200 flex flex-col justify-between"
        style={{ width: "950px", height: "650px", margin: "0 auto" }}
      >
        {/* Background Pattern - subtle KFL lines */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute top-0 left-0 w-full h-full bg-repeat"
            style={{ backgroundImage: 'url("/kfl-logo.png")', backgroundSize: "100px", opacity: 0.05 }}
          ></div>
        </div>

        {/* Header */}
        <div className="relative z-10 text-center pt-4">
          <img src="/kfl-logo.png" alt="KFL Logo" className="h-20 mx-auto mb-2" />
          <p className="barlow text-3xl font-bold uppercase kfl-primary-text mb-4">PREDICT YOUR WINNER - RAFFLE DRAW</p>
        </div>

        {/* Winner Content */}
        <div className="relative z-10 text-center flex-grow flex flex-col justify-center items-center px-8">
          <div className="space-y-2 mb-8">
            <h2 className="barlow text-7xl font-black uppercase kfl-primary-text winner-glow-animation">
              CONGRATULATIONS!
            </h2>
          </div>
          <div className="bg-gray-100 rounded-xl p-8 w-full max-w-2xl shadow-inner">
            <h3 className="barlow text-5xl font-bold uppercase kfl-primary-text mb-4">
              {winner.UserName || winner.Username || "WINNER"}
            </h3>
            <p className="barlow text-2xl font-medium kfl-secondary-text mb-4 italic whitespace-nowrap">
              YOU HAVE BEEN SELECTED AS THE LUCKY WINNER!
            </p>
            <div className="space-y-3 text-xl barlow kfl-secondary-text">
              <p>
                <span className="font-semibold uppercase">FIGHT:</span> {fightColumn.toUpperCase()}
              </p>
              {/* Removed Tournament line */}
              <p>
                <span className="font-semibold uppercase">YOUR PREDICTION:</span>{" "}
                {(winner[fightColumn] || "").toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-between items-end px-8 pb-4">
          <div className="flex items-center gap-2">
            <span className="barlow text-lg font-medium uppercase kfl-secondary-text">POWERED BY</span>
            <img src="/emojot-logo.png" alt="Emojot" className="h-8" />
          </div>
          <p className="barlow text-lg font-medium uppercase kfl-secondary-text text-right">
            {formattedDate}
            <br />
            {formattedTime}
          </p>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex justify-center gap-4">
        <Button onClick={exportAsPNG} className="barlow font-bold text-lg kfl-button-bg">
          <FileImage className="h-5 w-5 mr-2" />
          EXPORT AS PNG
        </Button>
        <Button onClick={exportAsPDF} className="barlow font-bold text-lg kfl-button-bg">
          <Download className="h-5 w-5 mr-2" />
          EXPORT AS PDF
        </Button>
      </div>
    </div>
  )
}
