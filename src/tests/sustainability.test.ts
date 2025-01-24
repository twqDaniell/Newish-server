// tests/sustainability_controller.test.ts
require("dotenv").config({ path: ".env.test" });
import { Request, Response } from 'express';

// Declare mockCreate before jest.mock so it can be assigned within the factory
let mockCreate: jest.Mock;

// Mock the 'openai' module
jest.mock('openai', () => {
  // Assign jest.fn() to mockCreate
  mockCreate = jest.fn();

  // Return the mocked OpenAi class
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

// Now import the controller after jest.mock
import { getSustainabilityTips } from '../controllers/sustainability_controller';
import OpenAi from 'openai';

describe('getSustainabilityTips', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(() => {
    // Initialize mock request and response objects
    req = {}; // No specific properties needed for this handler

    mockStatus = jest.fn().mockReturnThis(); // Allows method chaining
    mockJson = jest.fn();

    res = {
      status: mockStatus,
      json: mockJson,
    };

    // Clear all mock calls and instances
    jest.clearAllMocks();
  });

  test('Returns sustainability tips successfully', async () => {
    // Define the mock response from OpenAI
    const mockResponse = {
      choices: [
        {
          message: {
            content:
              '1. Reduce, Reuse, Recycle\n2. Conserve Water\n3. Use Renewable Energy\n4. Support Sustainable Brands\n5. Minimize Waste',
          },
        },
      ],
    };

    // Set up the mockCreate to resolve with the mock response
    mockCreate.mockResolvedValueOnce(mockResponse);

    // Invoke the handler
    await getSustainabilityTips(req as Request, res as Response);

    // Assertions
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a sustainability expert.',
        },
        {
          role: 'user',
          content: 'Give me 5 tips about sustainability.',
        },
      ],
    });

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      tips: [
        '1. Reduce, Reuse, Recycle',
        '2. Conserve Water',
        '3. Use Renewable Energy',
        '4. Support Sustainable Brands',
        '5. Minimize Waste',
      ],
    });
  });

  test('Handles OpenAI API error gracefully', async () => {
    // Set up the mockCreate to reject with an error
    mockCreate.mockRejectedValueOnce(new Error('API error'));

    // Invoke the handler
    await getSustainabilityTips(req as Request, res as Response);

    // Assertions
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a sustainability expert.',
        },
        {
          role: 'user',
          content: 'Give me 5 tips about sustainability.',
        },
      ],
    });

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      error: 'Failed to fetch sustainability tips',
    });
  });
});
