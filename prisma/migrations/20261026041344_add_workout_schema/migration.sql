-- CreateEnum
CREATE TYPE "PieceType" AS ENUM ('FOR_TIME', 'AMRAP', 'EMOM', 'STRENGTH', 'OTHER');

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Piece" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workoutSessionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "type" "PieceType" NOT NULL,
    "title" TEXT,
    "scheme" TEXT,
    "timeCapSeconds" INTEGER,
    "durationSeconds" INTEGER,
    "intervalSeconds" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Piece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PieceMovement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "reps" INTEGER,
    "loadKg" DOUBLE PRECISION,
    "distanceM" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "PieceMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "timeSeconds" INTEGER,
    "rounds" INTEGER,
    "reps" INTEGER,
    "loadKg" DOUBLE PRECISION,
    "rx" BOOLEAN NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutSession_userId_date_idx" ON "WorkoutSession"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSession_id_userId_key" ON "WorkoutSession"("id", "userId");

-- CreateIndex
CREATE INDEX "Piece_workoutSessionId_position_idx" ON "Piece"("workoutSessionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Piece_id_userId_key" ON "Piece"("id", "userId");

-- CreateIndex
CREATE INDEX "PieceMovement_pieceId_position_idx" ON "PieceMovement"("pieceId", "position");

-- CreateIndex
CREATE INDEX "PieceMovement_movementId_idx" ON "PieceMovement"("movementId");

-- CreateIndex
CREATE UNIQUE INDEX "Result_pieceId_userId_key" ON "Result"("pieceId", "userId");

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Piece" ADD CONSTRAINT "Piece_workoutSessionId_userId_fkey" FOREIGN KEY ("workoutSessionId", "userId") REFERENCES "WorkoutSession"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceMovement" ADD CONSTRAINT "PieceMovement_pieceId_userId_fkey" FOREIGN KEY ("pieceId", "userId") REFERENCES "Piece"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceMovement" ADD CONSTRAINT "PieceMovement_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_pieceId_userId_fkey" FOREIGN KEY ("pieceId", "userId") REFERENCES "Piece"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
