import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarQueries } from 'api'
import { useModal } from 'hooks/useModal'
import Pusher from 'pusher-js'
import toast from 'react-hot-toast'
import { Button, Calendar, ConfigProvider } from 'antd'
import { Box, WrappedBox } from 'components/Box'
import { Loader } from 'components/Loader'
import { CellRender } from './components/CellRender'
import { EventModal } from './components/EventModal'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import locale from 'antd/locale/ru_RU'
import { errorToastWithButton } from 'utils/errorToastWithButton'
import { EventDto } from 'types/api'
import type { CalendarMode } from 'antd/es/calendar/generateCalendar'
import { PUSHER_SECRET_KEY } from 'config/pusher'
import { dateFormatter, timeFormatter, validateDateBetweenTwoDates } from './utils'
import { MONTH_MODE, YEAR_MODE, DATE_FORMAT } from './helpers'

export const Test3 = () => {
  const {
    isOpen: isEventModalOpen,
    closeModal: closeEventModal,
    openModal: openEventModal,
  } = useModal()

  const navigate = useNavigate()
  const [calendarMode, setCalendarMode] = useState<CalendarMode>(MONTH_MODE)
  const [selectedEvents, setSelectedEvents] = useState<EventDto[]>([])
  const { useGetCalendarEventsListQuery } = CalendarQueries

  const {
    data: calendarEvents = [],
    isLoading: isCalendarEventsLoading,
    isError: isCalendarEventsError,
    refetch: refetchCalendarEvents,
  } = useGetCalendarEventsListQuery()

  useEffect(() => {
    if (isCalendarEventsError) errorToastWithButton({ retry: () => refetchCalendarEvents() })
  }, [isCalendarEventsError, refetchCalendarEvents])

  const getEventsListByDate = (date: Dayjs): EventDto[] => {
    const currentCellDate = dateFormatter(date)

    return calendarEvents.filter(({ start_date, end_date }) =>
      validateDateBetweenTwoDates(start_date.slice(0, 10), end_date.slice(0, 10), currentCellDate),
    )
  }

  const getMounthEventsListByDate = (date: Dayjs): EventDto[] =>
    calendarEvents.filter(
      ({ start_date }) => dayjs(start_date, DATE_FORMAT).month() === date.month(),
    )

  const monthCellRender = (value: Dayjs) => {
    const events = getMounthEventsListByDate(value)

    if (events.length !== 0) return <CellRender events={events} />
  }

  const dateCellRender = (value: Dayjs) => {
    const events = getEventsListByDate(value)

    return <CellRender events={events} />
  }

  const eventshHendler = (value: Dayjs) => {
    const events =
      (calendarMode === MONTH_MODE && getEventsListByDate(value)) ||
      (calendarMode === YEAR_MODE && getMounthEventsListByDate(value)) ||
      []

    setSelectedEvents(() => events)
    openEventModal()
  }

  useEffect(() => {
    const pusher = new Pusher(PUSHER_SECRET_KEY, {
      cluster: 'eu',
    })

    try {
      const channel = pusher.subscribe('calendar-notifications')
      channel.bind('reminder-event', ({ title, start_date, end_date }: EventDto) => {
        toast(
          `У вас запланированно "${title}" c ${timeFormatter(start_date)} до ${timeFormatter(
            end_date,
          )}`,
          {
            position: 'top-right',
            duration: 6000,
          },
        )
      })
    } catch (error) {
      console.error(error)
    }
  }, [])

  if (isCalendarEventsLoading)
    return (
      <WrappedBox>
        <Loader />
      </WrappedBox>
    )

  return (
    <Box>
      <Box marginBottom={20} alignItems='end'>
        <Button
          type='primary'
          size='large'
          style={{ width: 150 }}
          onClick={() => navigate('/test3/create')}
        >
          Создать
        </Button>
      </Box>
      <ConfigProvider locale={locale}>
        <Calendar
          dateCellRender={dateCellRender}
          monthCellRender={monthCellRender}
          defaultValue={dayjs(new Date())}
          onSelect={eventshHendler}
          onPanelChange={(_, mode) => setCalendarMode(mode)}
        />
      </ConfigProvider>
      {isEventModalOpen && (
        <EventModal
          isOpen={isEventModalOpen}
          closeModal={closeEventModal}
          events={selectedEvents}
        />
      )}
    </Box>
  )
}
