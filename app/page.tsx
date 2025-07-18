"use client"

import type React from "react"

import { useState, useCallback } from "react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, Trophy, Users, Filter, Shuffle, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WinnerCard } from "@/components/WinnerCard"

interface ParticipantData {
  [key: string]: string | number
}

interface FilterCondition {
  column: string
  value: string
}

export default function RaffleDrawApp() {
  const [tournamentType, setTournamentType] = useState<string>("")
  const [data, setData] = useState<ParticipantData[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [availableTournamentTypes, setAvailableTournamentTypes] = useState<string[]>([])
  const [filterCondition, setFilterCondition] = useState<FilterCondition>({ column: "", value: "" })
  const [filteredData, setFilteredData] = useState<ParticipantData[]>([])
  const [winner, setWinner] = useState<ParticipantData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [availableFighters, setAvailableFighters] = useState<string[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentName, setCurrentName] = useState<string>("")
  const [drawTime, setDrawTime] = useState<Date | null>(null) // State to store draw time

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ParticipantData[]

        if (jsonData.length > 0) {
          const columnNames = Object.keys(jsonData[0])
          setColumns(columnNames)
          setData(jsonData)
          setFilteredData(jsonData)
          setWinner(null)
          setTournamentType("")
          setFilterCondition({ column: "", value: "" })
          setDrawTime(null) // Reset draw time on new upload

          // Find available tournament types
          const tournamentTypes = []
          if (columnNames.some((col) => col.toLowerCase().includes("bout schedule"))) {
            tournamentTypes.push("Bout Schedule")
          }
          if (columnNames.some((col) => col.toLowerCase().includes("xtreme championship"))) {
            tournamentTypes.push("Xtreme Championship")
          }
          setAvailableTournamentTypes(tournamentTypes)
        }
      } catch (error) {
        console.error("ERROR PARSING FILE:", error)
      } finally {
        setIsLoading(false)
      }
    }

    reader.readAsArrayBuffer(file)
  }, [])

  const applyFilter = useCallback(() => {
    if (!filterCondition.column || !filterCondition.value) {
      // Filter by tournament type first
      const voteColumn = columns.find((col) => col.toLowerCase().includes("select where you vote"))
      const tournamentFiltered = data.filter((participant) => {
        if (voteColumn) {
          const voteValue = participant[voteColumn]
          return voteValue && voteValue.toString().toLowerCase().includes(tournamentType.toLowerCase())
        }
        return true
      })
      setFilteredData(tournamentFiltered)
      return
    }

    // First filter by tournament type, then by fight prediction
    const voteColumn = columns.find((col) => col.toLowerCase().includes("select where you vote"))
    const tournamentFiltered = data.filter((participant) => {
      if (voteColumn) {
        const voteValue = participant[voteColumn]
        return voteValue && voteValue.toString().toLowerCase().includes(tournamentType.toLowerCase())
      }
      return true
    })

    const filtered = tournamentFiltered.filter((participant) => {
      const cellValue = participant[filterCondition.column]
      return (
        cellValue &&
        cellValue.toString().trim().toLowerCase() === filterCondition.value.toLowerCase() &&
        cellValue.toString().trim() !== "" &&
        cellValue.toString().toLowerCase() !== "null"
      )
    })

    setFilteredData(filtered)
    setWinner(null)
    setDrawTime(null) // Reset draw time on new filter
  }, [data, filterCondition, tournamentType, columns])

  const selectRandomWinner = useCallback(() => {
    if (filteredData.length === 0) return

    setIsDrawing(true)
    setWinner(null)
    setDrawTime(null)

    // Animation: cycle through names for 4 seconds
    const animationDuration = 4000
    const intervalTime = 100
    const totalCycles = animationDuration / intervalTime

    let cycleCount = 0
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * filteredData.length)
      const randomParticipant = filteredData[randomIndex]
      setCurrentName(randomParticipant.UserName || randomParticipant.Username || "PARTICIPANT")

      cycleCount++
      if (cycleCount >= totalCycles) {
        clearInterval(interval)

        // Select final winner
        const finalIndex = Math.floor(Math.random() * filteredData.length)
        const finalWinner = filteredData[finalIndex]

        setTimeout(() => {
          setWinner(finalWinner)
          setDrawTime(new Date()) // Set draw time when winner is selected
          setIsDrawing(false)
          setCurrentName("")
        }, 500)
      }
    }, intervalTime)
  }, [filteredData])

  const resetAll = () => {
    setTournamentType("")
    setData([])
    setColumns([])
    setAvailableTournamentTypes([])
    setFilterCondition({ column: "", value: "" })
    setFilteredData([])
    setWinner(null)
    setIsDrawing(false)
    setCurrentName("")
    setDrawTime(null)
  }

  const getFightColumns = () => {
    if (!tournamentType) return []

    // First, filter participants by tournament type
    const voteColumn = columns.find((col) => col.toLowerCase().includes("select where you vote"))
    const tournamentParticipants = data.filter((participant) => {
      if (voteColumn) {
        const voteValue = participant[voteColumn]
        return voteValue && voteValue.toString().toLowerCase().includes(tournamentType.toLowerCase())
      }
      return true
    })

    // Get the tournament-specific column name
    const tournamentColumn = columns.find((col) => col.toLowerCase().includes(tournamentType.toLowerCase()))

    if (!tournamentColumn) return []

    // Get unique fight names from the tournament column
    const uniqueFights = new Set<string>()
    tournamentParticipants.forEach((participant) => {
      const fightValue = participant[tournamentColumn]
      if (
        fightValue &&
        fightValue.toString().trim() !== "" &&
        fightValue.toString().toLowerCase() !== "null" &&
        fightValue.toString().toLowerCase().includes("vs")
      ) {
        uniqueFights.add(fightValue.toString().trim())
      }
    })

    // Return columns that match these fight names
    const fightNames = Array.from(uniqueFights)
    return columns.filter((col) => {
      return fightNames.some((fight) => col.toLowerCase() === fight.toLowerCase())
    })
  }

  const extractFightersFromColumn = useCallback((columnName: string) => {
    if (!columnName.toLowerCase().includes("vs")) return []

    // Split by 'vs' and clean up the names
    const fighters = columnName.split(/\s+vs\s+/i).map((fighter) => fighter.trim())
    return fighters.filter((fighter) => fighter.length > 0)
  }, [])

  return (
    <div className="min-h-screen bg-white barlow">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <img src="/kfl-logo.png" alt="KFL Logo" className="h-24 mx-auto" />
          <p className="barlow text-3xl font-bold uppercase kfl-primary-text">PREDICT YOUR WINNER - RAFFLE DRAW</p>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <span className="text-lg uppercase barlow font-medium">POWERED BY</span>
            <img src="/emojot-logo.png" alt="Emojot" className="h-8" />
          </div>
        </div>

        {/* File Upload */}
        <Card className="bg-white border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="barlow text-2xl font-bold uppercase kfl-primary-text flex items-center gap-3">
              <Upload className="h-6 w-6 kfl-primary-text" />
              STEP 1: UPLOAD EXCEL SHEET
            </CardTitle>
            <CardDescription className="text-gray-600 barlow italic">
              UPLOAD YOUR EXCEL FILE WITH PARTICIPANT PREDICTIONS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="max-w-md bg-gray-50 border-gray-300 text-black file:text-black barlow"
              />
              {isLoading && (
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                  <span className="barlow font-medium uppercase">LOADING FILE...</span>
                </div>
              )}
              {data.length > 0 && (
                <Alert className="bg-green-100 border-green-300 text-green-800">
                  <Users className="h-4 w-4 text-green-600" />
                  <AlertDescription className="barlow font-medium uppercase">
                    SUCCESSFULLY LOADED {data.length} PARTICIPANTS WITH {columns.length} COLUMNS
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tournament Type Selection */}
        {availableTournamentTypes.length > 0 && (
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="barlow text-2xl font-bold uppercase kfl-primary-text flex items-center gap-3">
                <Filter className="h-6 w-6 kfl-primary-text" />
                STEP 2: SELECT TOURNAMENT TYPE
              </CardTitle>
              <CardDescription className="text-gray-600 barlow italic">
                CHOOSE WHICH TOURNAMENT TYPE YOU WANT TO DRAW WINNERS FOR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={tournamentType}
                onValueChange={(value) => {
                  setTournamentType(value)
                  setFilterCondition({ column: "", value: "" })
                  setTimeout(() => {
                    const voteColumn = columns.find((col) => col.toLowerCase().includes("select where you vote"))
                    const tournamentFiltered = data.filter((participant) => {
                      if (voteColumn) {
                        const voteValue = participant[voteColumn]
                        return voteValue && voteValue.toString().toLowerCase().includes(value.toLowerCase())
                      }
                      return true
                    })
                    setFilteredData(tournamentFiltered)
                  }, 100)
                }}
              >
                <SelectTrigger className="w-full max-w-md bg-gray-50 border-gray-300 text-black barlow">
                  <SelectValue placeholder="SELECT TOURNAMENT TYPE" />
                </SelectTrigger>
                <SelectContent>
                  {availableTournamentTypes.map((type) => (
                    <SelectItem key={type} value={type} className="barlow font-semibold uppercase">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Filter Conditions */}
        {tournamentType && (
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="barlow text-2xl font-bold uppercase kfl-primary-text flex items-center gap-3">
                <Sparkles className="h-6 w-6 kfl-primary-text" />
                STEP 3: SET FILTER CONDITIONS
              </CardTitle>
              <CardDescription className="text-gray-600 barlow italic">
                FILTER PARTICIPANTS BASED ON THEIR PREDICTIONS FOR {tournamentType.toUpperCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="filter-column" className="kfl-primary-text barlow font-semibold uppercase">
                    FIGHT COLUMN
                  </Label>
                  <Select
                    value={filterCondition.column}
                    onValueChange={(value) => {
                      setFilterCondition((prev) => ({ ...prev, column: value, value: "" }))
                      const fighters = extractFightersFromColumn(value)
                      setAvailableFighters(fighters)
                    }}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-300 text-black barlow">
                      <SelectValue placeholder="SELECT FIGHT COLUMN" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFightColumns().map((column) => (
                        <SelectItem key={column} value={column} className="barlow uppercase">
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-value" className="kfl-primary-text barlow font-semibold uppercase">
                    SELECT FIGHTER
                  </Label>
                  <Select
                    value={filterCondition.value}
                    onValueChange={(value) => setFilterCondition((prev) => ({ ...prev, value }))}
                    disabled={!filterCondition.column}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-300 text-black barlow">
                      <SelectValue placeholder="SELECT FIGHTER" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFighters.map((fighter) => (
                        <SelectItem key={fighter} value={fighter} className="barlow font-semibold uppercase">
                          {fighter}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={applyFilter}
                    className="w-full kfl-button-bg hover:opacity-90 barlow font-bold text-lg uppercase"
                  >
                    APPLY FILTER
                  </Button>
                </div>
              </div>

              {filteredData.length > 0 && (
                <div className="mt-6">
                  <Badge
                    variant="secondary"
                    className="text-lg px-4 py-2 barlow font-bold uppercase bg-gray-100 text-gray-800 border-gray-300"
                  >
                    {filteredData.length} PARTICIPANTS MATCH THE FILTER
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Winner Selection */}
        {filteredData.length > 0 && (
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="barlow text-2xl font-bold uppercase kfl-primary-text flex items-center gap-3">
                <Trophy className="h-6 w-6 kfl-primary-text" />
                STEP 4: DRAW RANDOM WINNER
              </CardTitle>
              <CardDescription className="text-gray-600 barlow italic">
                SELECT A RANDOM WINNER FROM FILTERED PARTICIPANTS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="text-center">
                  <Button
                    onClick={selectRandomWinner}
                    disabled={isDrawing}
                    size="lg"
                    className="kfl-button-bg hover:opacity-90 barlow font-black text-xl px-8 py-4 uppercase disabled:opacity-50"
                  >
                    <Shuffle className="h-6 w-6 mr-3" />
                    {isDrawing ? "DRAWING WINNER..." : "DRAW RANDOM WINNER"}
                  </Button>
                </div>

                {/* Animation Display */}
                {isDrawing && (
                  <div className="text-center py-12">
                    <div className="space-y-4">
                      <div className="text-gray-700 barlow text-lg font-semibold uppercase">SELECTING WINNER...</div>
                      <div className="name-cycling barlow text-5xl font-black kfl-primary-text">
                        {currentName.toUpperCase()}
                      </div>
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Winner Display */}
                {winner && !isDrawing && drawTime && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <div className="barlow text-7xl font-black kfl-primary-text winner-animation mb-4 uppercase">
                        {winner.UserName || winner.Username || "WINNER"}
                      </div>
                      <div className="kfl-primary-text barlow text-3xl font-semibold uppercase">
                        🎉 WINNER SELECTED! 🎉
                      </div>
                    </div>

                    <WinnerCard
                      winner={winner}
                      fightColumn={filterCondition.column}
                      tournamentType={tournamentType}
                      drawTime={drawTime}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Preview */}
        {data.length > 0 && (
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="barlow text-2xl font-bold uppercase kfl-primary-text">DATA PREVIEW</CardTitle>
              <CardDescription className="text-gray-600 barlow italic">
                SHOWING {filteredData.length} OF {data.length} PARTICIPANTS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      {columns.slice(0, 6).map((column) => (
                        <th
                          key={column}
                          className="border border-gray-200 px-4 py-3 text-left font-semibold kfl-primary-text barlow uppercase"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice(0, 10).map((row, index) => (
                      <tr
                        key={index}
                        className={`${winner === row ? "bg-yellow-100" : "hover:bg-gray-50"} text-gray-800`}
                      >
                        {columns.slice(0, 6).map((column) => (
                          <td key={column} className="border border-gray-200 px-4 py-2 barlow">
                            {row[column]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredData.length > 10 && (
                  <p className="text-sm text-gray-600 mt-4 barlow italic">
                    SHOWING FIRST 10 ROWS OF {filteredData.length} TOTAL
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reset Button */}
        {data.length > 0 && (
          <div className="flex justify-center pb-8">
            <Button
              variant="outline"
              onClick={resetAll}
              className="barlow font-bold text-lg px-8 py-3 bg-white border-gray-300 text-black hover:bg-gray-100 uppercase"
            >
              RESET ALL
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
