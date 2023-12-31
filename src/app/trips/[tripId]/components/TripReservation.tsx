"use client";
import Button from "@/components/Button";
import DatePicker from "@/components/DatePicker";
import Input from "@/components/input";
import { Trip } from "@prisma/client";
import { differenceInDays, max } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { start } from "repl";

interface TripReservationProps {
  tripStartDate: Date;
  tripEndDate: Date;
  maxGuests: number;
  pricePerDay: number;
  tripId: string;
}

interface TripReservationForm {
  guests: number;
  startDate: Date | null;
  endDate: Date | null;
}

const TripReservation = ({
  tripStartDate,
  tripEndDate,
  maxGuests,
  pricePerDay,
  tripId,
}: TripReservationProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setError,
  } = useForm<TripReservationForm>();

  const router = useRouter();

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  const onSubmit = async (data: TripReservationForm) => {
    const response = await fetch("/api/trips/check", {
      method: "POST",
      body: Buffer.from(
        JSON.stringify({
          startDate: data.startDate,
          endDate: data.endDate,
          tripId,
        })
      ),
    });
    const res = await response.json();

    if (res?.error?.code === "TRIP_ALREADY_RESERVED") {
      setError("startDate", {
        type: "manual",
        message: "Data já reservada.",
      });
      setError("endDate", {
        type: "manual",
        message: "Data já reservada.",
      });
    } else if (res?.error?.code === "INVALID_START_DATE") {
      setError("startDate", {
        type: "manual",
        message: "Data inválida.",
      });
    } else if (res?.error?.code === "INVALID_END_DATE") {
      setError("endDate", {
        type: "manual",
        message: "Data inválida.",
      });
    } else {
      // Quando passar de todos os erros redireciona pra confirmação com os dados preenchidos
      router.push(
        `/trips/${tripId}/confirmation?startDate=${data.startDate?.toISOString()}&endDate=${data.endDate?.toISOString()}&guests=${
          data.guests
        }`
      );
    }
  };

  return (
    <div className="flex flex-col px-5 lg:min-w-[380px] lg:p-5 lg:border-grayLighter lg:border lg:rounded-lg lg:shadow-md">
      <p className="hidden text-xl text-primaryDarker mb-4 lg:block">
        <span className="font-semibold">R${pricePerDay}</span> por dia
      </p>

      <div className="flex gap-4">
        <Controller
          name="startDate"
          rules={{
            required: {
              value: true,
              message: "Data de ida é obrigatória.",
            },
          }}
          control={control}
          render={({ field }) => (
            <DatePicker
              error={!!errors?.startDate}
              errorMessage={errors?.startDate?.message}
              placeholderText="Data de ida"
              onChange={field.onChange}
              selected={field.value}
              className="w-full"
              minDate={tripStartDate}
              maxDate={tripEndDate}
            />
          )}
        />

        <Controller
          name="endDate"
          rules={{
            required: {
              value: true,
              message: "Data de volta é obrigatória.",
            },
          }}
          control={control}
          render={({ field }) => (
            <DatePicker
              error={!!errors?.endDate}
              errorMessage={errors?.endDate?.message}
              placeholderText="Data de volta"
              onChange={field.onChange}
              selected={field.value}
              className="w-full"
              minDate={startDate ?? tripStartDate}
              maxDate={tripEndDate}
            />
          )}
        />
      </div>

      <Input
        {...register("guests", {
          required: {
            value: true,
            message: "Número de hóspedes é obrigatório.",
          },
          max: {
            value: maxGuests,
            message: `Número de hóspedes deve ser menor ou igual a ${maxGuests}.`,
          },
        })}
        placeholder={`Número de hóspedes (max: ${maxGuests})`}
        className="mt-4"
        error={!!errors?.guests}
        errorMessage={errors?.guests?.message}
      />

      <div className="flex justify-between mt-3">
        <p className="font-medium text-sm text-primaryDarker">Total: </p>
        <p className="font-medium text-sm text-primaryDarker">
          {startDate && endDate
            ? "R$ " + differenceInDays(endDate, startDate) * pricePerDay
            : "R$ 0"}
        </p>
      </div>
      <div className="pb-10 border-b border-grayLighter w-full lg:border-none lg:pb-0">
        <Button
          onClick={() => handleSubmit(onSubmit)()}
          className="mt-3 w-full"
        >
          Reservar agora
        </Button>
      </div>
    </div>
  );
};

export default TripReservation;
