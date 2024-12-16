import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaSearch, FaFilter, FaCalendarAlt, FaEdit, FaTrash, FaPlus, FaChartBar, FaSort, FaUsers, FaTag, FaClock, FaUserFriends, FaInfo } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminEvents = () => {
  const navigate = useNavigate();
  const [theme] = useState('light');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const token = sessionStorage.getItem('jwtToken');
  const [events, setEvents] = useState({
    ongoing: [],
    upcoming: [],
    past: [],
    featured: []
  });
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalAttendees: 0
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    imageUrl: '',
    eventType: 'Event'
  });

  useEffect(() => {
    // Fetch all events from backend
    const fetchEvents = async () => {
      try {
        const response = await axios.get('http://localhost:9997/event/getAllEvents', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const allEvents = response.data;

        // Categorize events based on date
        const now = new Date();
        const categorizedEvents = {
          ongoing: [],
          upcoming: [],
          past: [],
          featured: []
        };

        allEvents.forEach(event => {
          const eventDate = new Date(event.eventDate);
          if (eventDate < now) {
            categorizedEvents.past.push({...event, status: 'past'});
          } else if (eventDate.toDateString() === now.toDateString()) {
            categorizedEvents.ongoing.push(event);
          } else {
            categorizedEvents.upcoming.push(event);
          }
        });

        setEvents(categorizedEvents);
        setStats({
          totalEvents: allEvents.length,
          activeEvents: categorizedEvents.ongoing.length + categorizedEvents.upcoming.length,
          totalAttendees: 0
        });
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, []);

  const handleCreateEvent = () => {
    setShowEventForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const localDateTime = new Date(formData.date).toISOString();

    try {
      const token = sessionStorage.getItem('jwtToken');
      const userId = sessionStorage.getItem('userId');

      if (formData.eventType === 'Event') {
            console.log(formData);
      const response = await axios.post('http://localhost:9997/event/add',
        {
          eventTitle: formData.title,
          eventDescription: formData.description,
          eventDate: localDateTime,
          eventImg: formData.imageUrl,
          eventType: formData.eventType,
          userId: userId
        },
        {
          headers: {
            Authorization: token,
          },
        }
      );
    }else {
      const response = await axios.get('http://localhost:9997/reminder/sendUrgentsmsAndCall',
        {
          headers: {
            Authorization: token,
          },
          params: {
            Message: formData.description
          }
        }
      );
    }
      setShowEventForm(false);
    } catch(error) {
      setShowEventForm(false);
      console.error('Error creating event:', error);
    }
  };

  const handleAnalytics = () => {
    navigate('/admin/analytics');
  };

  const filterEvents = (eventsList) => {
    return eventsList.filter(event => 
      event.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.eventDescription.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const renderEventCard = (event) => (
    <EventCard key={event.eventId} $theme={theme}>
      <EventStatus $status={event.status}>
        {event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : 'Upcoming'}
      </EventStatus>
      <EventTitle $theme={theme}>{event.eventTitle}</EventTitle>
      <EventDetail $theme={theme}>
        <FaCalendarAlt /> {new Date(event.eventDate).toLocaleDateString()}
      </EventDetail>
      <EventDetail $theme={theme}>
        <FaClock /> {new Date(event.eventDate).toLocaleTimeString()}
      </EventDetail>
      <EventDetail $theme={theme}>
        <FaInfo /> {event.eventDescription}
      </EventDetail>
      <TagsContainer>
        {event.tags && event.tags.map(tag => (
          <Tag key={tag} $theme={theme}>#{tag}</Tag>
        ))}
      </TagsContainer>
    </EventCard>
  );

  return (
    <PageContainer $theme={theme}>
      {showEventForm && (
        <FormContainer>
          <FormCard>
            <Title>Create Event</Title>
            <Form onSubmit={handleSubmit}>
            {formData.eventType === 'Event' && (
              <Input
                type="text"
                placeholder="Event Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            )}

              <TextArea
                placeholder="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />

              <Input
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />

              <Select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                required
              >
                <option value="Event">Event</option>
                <option value="Emergency Message">Emergency Message</option>
              </Select>

              {formData.eventType === 'Event' && (
                <Input
                  type="url"
                  placeholder="Image URL"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                />
              )}

              <Button type="submit">Create Event</Button>
              <Button type="button" onClick={() => setShowEventForm(false)} style={{background: '#6c757d'}}>
                Cancel
              </Button>
            </Form>
          </FormCard>
        </FormContainer>
      )}

      <StatsContainer>
        <StatCard $theme={theme}>
          <h4>Total Events</h4>
          <p>{stats.totalEvents}</p>
        </StatCard>
        <StatCard $theme={theme}>
          <h4>Active Events</h4>
          <p>{stats.activeEvents}</p>
        </StatCard>
      </StatsContainer>

      <ControlsContainer>
        <SearchBar $theme={theme}>
          <FaSearch />
          <input 
            type="text" 
            placeholder="Search events..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBar>
        <ButtonGroup>
          <ActionButton onClick={handleCreateEvent}>
            <FaPlus /> Create Event
          </ActionButton>
          <ActionButton $secondary onClick={handleAnalytics}>
            <FaChartBar /> Analytics
          </ActionButton>
        </ButtonGroup>
      </ControlsContainer>

      <SectionTitle $theme={theme}>Upcoming Events</SectionTitle>
      <EventsGrid>
        {filterEvents(events.upcoming).map(renderEventCard)}
      </EventsGrid>

      <SectionTitle $theme={theme}>Past Events</SectionTitle>
      <EventsGrid>
        {filterEvents(events.past).map(renderEventCard)}
      </EventsGrid>
    </PageContainer>
  );
};

const FormContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const FormCard = styled.div`
  background: white;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 30px;
  color: #1a237e;
  font-weight: 700;
  background: linear-gradient(45deg, #1a237e, #3949ab);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #1a237e;
    box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.1);
  }
`;

const Select = styled.select`
  padding: 12px;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #1a237e;
    box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 12px;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  font-size: 16px;
  min-height: 120px;
  
  &:focus {
    outline: none;
    border-color: #1a237e;
    box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.1);
  }
`;

const Button = styled.button`
  padding: 12px;
  background: #1a237e;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #3949ab;
    transform: translateY(-2px);
  }
`;

const PageContainer = styled.div`
  padding: 30px 40px;
  margin-top: 80px;
  background: #f0f2f5;
  min-height: calc(100vh - 80px);
  color: #2c3e50;
`;

const ControlsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: #ffffff;
  padding: 20px 30px;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 8px 15px;
  width: 300px;
  border: 1px solid #eef2f7;

  input {
    border: none;
    outline: none;
    margin-left: 10px;
    width: 100%;
    background: transparent;
    color: #2c3e50;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: ${props => props.$secondary ? '#6c757d' : '#1a237e'};
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    background: ${props => props.$secondary ? '#5a6268' : '#3949ab'};
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
`;

const StatCard = styled.div`
  background: #ffffff;
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
  border-left: 5px solid #1a237e;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  h4 {
    color: #666;
    margin: 0;
    font-size: 1rem;
  }

  p {
    font-size: 2rem;
    font-weight: 700;
    margin: 5px 0 0;
    color: #1a237e;
  }
`;

const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
`;

const EventCard = styled.div`
  background: #ffffff;
  border-radius: 15px;
  padding: 25px;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border-left: 5px solid #1a237e;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const EventStatus = styled.div`
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch(props.$status) {
      case 'ongoing': return '#4CAF50';
      case 'upcoming': return '#1a237e';
      case 'past': return '#9e9e9e';
      default: return '#4CAF50';
    }
  }};
  color: white;
`;

const EventTitle = styled.h3`
  margin: 30px 0 15px;
  color: #1a237e;
  font-weight: 600;
`;

const EventDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  color: #666;
  font-size: 0.95rem;
`;

const TagsContainer = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 15px;
`;

const Tag = styled.span`
  padding: 6px 12px;
  background: rgba(26, 35, 126, 0.1);
  border-radius: 20px;
  font-size: 12px;
  color: #1a237e;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #1a237e;
    color: white;
  }
`;

const PastTag = styled.span`
  padding: 6px 12px;
  background: rgba(255, 0, 0, 0.1);
  border-radius: 20px;
  font-size: 12px;
  color: #ff0000;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #ff0000;
    color: white;
  }
`;

const SectionTitle = styled.h2`
  color: #1a237e;
  margin: 30px 0 20px;
  font-weight: 600;
  position: relative;
  padding-bottom: 10px;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 50px;
    height: 3px;
    background: #1a237e;
    border-radius: 2px;
  }
`;

export default AdminEvents;
