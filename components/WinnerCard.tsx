"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Download, FileImage } from "lucide-react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface WinnerCardProps {
  winner: any
  fightColumn: string
  tournamentType: string
  drawTime: Date
}

export function WinnerCard({ winner, fightColumn, tournamentType, drawTime }: WinnerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  // Temporary style override only for export
  const applyExportStyles = () => {
    if (!cardRef.current) return

    // Reduce height and padding to remove top space and include footer
    cardRef.current.style.minHeight = "auto"
    cardRef.current.style.paddingTop = "2rem" // reduce top padding (original was 2rem or more)
    cardRef.current.style.paddingBottom = "2rem" // ensure footer spacing preserved

    // Reduce margin above "CONGRATULATIONS!"
    const congrats = cardRef.current.querySelector("h2.winner-animation") as HTMLElement
    if (congrats) {
      congrats.style.marginTop = "0"
      congrats.style.paddingTop = "0"
    }
  }

  const resetStyles = () => {
    if (!cardRef.current) return

    // Reset to original styles
    cardRef.current.style.minHeight = "600px"
    cardRef.current.style.paddingTop = ""
    cardRef.current.style.paddingBottom = ""

    const congrats = cardRef.current.querySelector("h2.winner-animation") as HTMLElement
    if (congrats) {
      congrats.style.marginTop = ""
      congrats.style.paddingTop = ""
    }
  }

  const exportAsPNG = async () => {
    if (!cardRef.current) return

    applyExportStyles()

    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      scrollX: 0,
      scrollY: 0,
    })

    resetStyles()

    const link = document.createElement("a")
    link.download = `KFL-Winner-${winner.UserName || winner.Username || "Winner"}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  const exportAsPDF = async () => {
  if (!cardRef.current) return

  applyExportStyles()

  const canvas = await html2canvas(cardRef.current, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    scrollX: 0,
    scrollY: 0,
  })

  resetStyles()

  const imgData = canvas.toDataURL("image/png")

  const pdf = new jsPDF("landscape", "mm", "a4")

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const margin = 10 // margin from edges

  const imgProps = {
    width: canvas.width,
    height: canvas.height,
  }

  // Calculate image dimensions to fit inside page with margins, preserving aspect ratio
  let imgWidth = pageWidth - margin * 2
  let imgHeight = (imgProps.height * imgWidth) / imgProps.width

  if (imgHeight > pageHeight - margin * 2) {
    imgHeight = pageHeight - margin * 2
    imgWidth = (imgProps.width * imgHeight) / imgProps.height
  }

  // Calculate coordinates to center the image
  const x = (pageWidth - imgWidth) / 2
  const y = (pageHeight - imgHeight) / 2

  pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight)
  pdf.save(`KFL-Winner-${winner.UserName || winner.Username || "Winner"}.pdf`)
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
    <div className="space-y-6">
      <div
        ref={cardRef}
        className="winner-card-bg p-8 rounded-2xl shadow-2xl text-black border border-gray-200 flex flex-col justify-between"
        style={{ width: "800px", minHeight: "600px", margin: "0 auto", backgroundColor: "#fff" }}
      >
        {/* Background Logo Pattern */}
        <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
          <div
            className="absolute top-0 left-0 w-full h-full bg-repeat"
            style={{ backgroundImage: 'url("/kfl-logo.png")', backgroundSize: "100px", opacity: 0.05 }}
          ></div>
        </div>

        {/* Header */}
        <div className="relative z-10 text-center mb-4">
          <img src="/kfl-logo.png" alt="KFL Logo" className="h-20 mx-auto mb-2" />
          <p className="barlow text-3xl font-bold uppercase kfl-primary-text">PREDICT YOUR WINNER - RAFFLE DRAW</p>
        </div>

        {/* Winner Info */}
        <div className="relative z-10 text-center space-y-6 mt-0 flex-grow">
          <h2 className="barlow text-7xl font-black uppercase kfl-accent-color winner-animation">CONGRATULATIONS!</h2>
          <div className="bg-gray-100 rounded-xl p-8 mx-8 shadow-inner">
            <h3 className="barlow text-5xl font-bold uppercase kfl-primary-text mb-4">
              {winner.UserName || winner.Username || "WINNER"}
            </h3>
            <p className="barlow text-2xl font-medium kfl-secondary-text mb-4 italic">
              YOU HAVE BEEN SELECTED AS THE LUCKY WINNER!
            </p>
            <div className="space-y-3 text-xl barlow kfl-secondary-text">
              <p>
                <span className="font-semibold uppercase">FIGHT:</span> {fightColumn.toUpperCase()}
              </p>
              <p>
                <span className="font-semibold uppercase">TOURNAMENT:</span> {tournamentType.toUpperCase()}
              </p>
              <p>
                <span className="font-semibold uppercase">YOUR PREDICTION:</span>{" "}
                {(winner[fightColumn] || "").toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-8 pt-4 border-t border-gray-300 flex justify-between items-center px-8">
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
