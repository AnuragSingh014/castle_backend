# Dashboard API Backend

This backend provides comprehensive API endpoints for managing dashboard data across all components for each user in the investment platform.

## Features

- **Complete Dashboard Data Management**: Store and retrieve data for all dashboard components
- **Automatic Completion Tracking**: Real-time calculation of completion percentage
- **Flexible Data Storage**: Support for various data types including files and images
- **User Isolation**: Each user's data is completely isolated
- **Comprehensive Validation**: Input validation and error handling
- **Performance Optimized**: Database indexing and efficient queries

## Components Supported

1. **Information** - Company basic information and contact details
2. **Overview** - Business overview, financial highlights, peer analysis, shareholding
3. **Beneficial Owner Certification** - Owner details and certification
4. **Company References** - Business references and relationships
5. **DD Form** - Due diligence form data
6. **Loan Details** - Loan application and collateral information

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## Installation

1. **Clone the repository and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables:**
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/castle_dashboard
   NODE_ENV=development
   ```

5. **Start MongoDB service** (if running locally)

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Base URL
```
http://localhost:5000/api/dashboard
```

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:userId` | Get all dashboard data for a user |
| GET | `/:userId/completion-status` | Get completion status for all components |
| POST | `/:userId/component/:component` | Save data for any component |
| POST | `/:userId/overview` | Save overview data with financial details |
| POST | `/:userId/information` | Save company information |
| POST | `/:userId/beneficial-owner` | Save beneficial owner certification |
| POST | `/:userId/company-references` | Save company references |
| POST | `/:userId/ddform` | Save due diligence form data |
| POST | `/:userId/loan-details` | Save loan details |
| DELETE | `/:userId` | Delete all dashboard data for a user |

## Data Models

### DashboardData Schema
The main schema includes:
- User reference
- Component-specific data structures
- Metadata (timestamps, completion status)
- File/document references
- Financial data with proper validation

### Component Data Structures
Each component has its own data structure optimized for:
- Form inputs
- File uploads
- Financial calculations
- Business logic requirements

## Testing

### Run API Tests
```bash
cd backend
node test-dashboard-api.js
```

### Test Coverage
The test script covers:
- All CRUD operations
- Data validation
- Error handling
- Completion tracking
- Component-specific endpoints

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # Database connection
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── userController.js   # User management
│   │   └── dashboardController.js # Dashboard operations
│   ├── models/
│   │   ├── User.js            # User model
│   │   └── DashboardData.js   # Dashboard data model
│   ├── routes/
│   │   ├── authRoutes.js      # Authentication routes
│   │   ├── userRoutes.js      # User routes
│   │   └── dashboardRoutes.js # Dashboard routes
│   └── server.js              # Main server file
├── test-dashboard-api.js      # API testing script
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Database Schema

### Collections
- **users**: User authentication and basic info
- **dashboard_data**: All dashboard component data

### Indexes
- `userId`: Primary lookup index
- `lastUpdated`: Sorting and filtering index

## Security Features

- **User Verification**: All endpoints verify user existence
- **Data Isolation**: No cross-user data access
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Secure error responses

## Performance Features

- **Database Indexing**: Optimized queries
- **Lazy Loading**: Component-specific data retrieval
- **Efficient Updates**: Partial data updates
- **Completion Tracking**: Real-time status calculation

## File Upload Support

### Supported Types
- Images: PNG, JPG (max 4 for overview)
- Documents: PDF, DOC, DOCX
- Size Limits: Configurable per component

### Storage Strategy
- File metadata stored in database
- Actual files stored in file system
- Secure naming conventions
- MIME type validation

## Error Handling

### Standard Error Responses
```json
{
  "error": "error_type",
  "message": "Detailed error message"
}
```

### HTTP Status Codes
- `200`: Success
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

## Monitoring and Logging

- Request/response logging
- Error tracking
- Performance monitoring
- Completion percentage tracking

## Future Enhancements

### Planned Features
- Real-time synchronization
- Advanced search and filtering
- Data export functionality
- Bulk operations
- Enhanced file management
- Audit trail logging

### Scalability
- Database sharding
- Caching layer
- Microservice architecture
- API rate limiting
- Load balancing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For questions or issues:
- Check the API documentation in `documentation.txt`
- Review the test examples
- Check server logs for errors
- Verify database connection

## License

This project is licensed under the MIT License. 