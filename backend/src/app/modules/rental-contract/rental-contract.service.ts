import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { RentalContract } from '../../db/entities/rental-contract.entity.js';
import { Viewing } from '../../db/entities/viewing.entity.js';
import { Listing } from '../../db/entities/listing.entity.js';
import { User } from '../../db/entities/user.entity.js';
import { NotificationService } from '../notification/notification.service.js';
import { ProposeContractDto } from './rental-contract.dto.js';
import { Op } from 'sequelize';

@Injectable()
export class RentalContractService {
    constructor(private readonly notificationService: NotificationService) {}

    // =========================================================================
    // PROPOSE CONTRACT (owner, after completed viewing)
    // =========================================================================

    async proposeContract(
        ownerId: number,
        viewingId: number,
        dto: ProposeContractDto,
    ) {
        const viewing = await Viewing.findByPk(viewingId, {
            include: [{ model: Listing }],
        });

        if (!viewing) {
            throw new NotFoundException('Vizionarea nu a fost găsită');
        }

        const listing = (viewing as any).property as Listing;

        if (!listing || listing.ownerId !== ownerId) {
            throw new ForbiddenException('Doar proprietarul listing-ului poate propune un contract');
        }

        if (viewing.status !== 'completed') {
            throw new BadRequestException('Contractul poate fi propus doar după finalizarea vizionării');
        }

        const contract = await RentalContract.create({
            listingId: listing.id,
            ownerId,
            seekerId: viewing.seekerId,
            status: 'proposed',
            monthlyRent: dto.monthlyRent,
            deposit: dto.deposit,
            currency: dto.currency ?? 'EUR',
            startDate: new Date(dto.startDate),
            endDate: new Date(dto.endDate),
            terms: dto.terms,
        });

        // Notify seeker
        try {
            await this.notificationService.create(viewing.seekerId, {
                type: 'contract_proposed',
                title: 'Contract de închiriere propus',
                body: `Proprietarul ți-a propus un contract pentru "${listing.title || 'proprietate'}"`,
                metadata: {
                    contractId: contract.id,
                    listingId: listing.id,
                    viewingId: viewing.id,
                },
            });
        } catch (err: any) {
            console.error('[RentalContractService] Failed to send contract_proposed notification:', err?.message);
        }

        return this.getContract(ownerId, contract.id);
    }

    // =========================================================================
    // ACCEPT (seeker)
    // =========================================================================

    async acceptContract(seekerId: number, contractId: number) {
        const contract = await this.findContractOrFail(contractId);

        if (contract.seekerId !== seekerId) {
            throw new ForbiddenException('Doar chiriașul poate accepta contractul');
        }

        if (contract.status !== 'proposed') {
            throw new BadRequestException(`Nu poți accepta un contract cu status '${contract.status}'`);
        }

        contract.status = 'accepted';
        await contract.save();

        // Notify owner
        try {
            const listing = await Listing.findByPk(contract.listingId, { attributes: ['title'] });
            await this.notificationService.create(contract.ownerId, {
                type: 'contract_accepted',
                title: 'Contract acceptat',
                body: `Chiriașul a acceptat contractul pentru "${listing?.title || 'proprietate'}"`,
                metadata: {
                    contractId: contract.id,
                    listingId: contract.listingId,
                },
            });
        } catch (err: any) {
            console.error('[RentalContractService] Failed to send contract_accepted notification:', err?.message);
        }

        return this.getContract(seekerId, contractId);
    }

    // =========================================================================
    // SIGN (owner or seeker)
    // =========================================================================

    async signContract(userId: number, contractId: number) {
        const contract = await this.findContractOrFail(contractId);

        const isOwner = contract.ownerId === userId;
        const isSeeker = contract.seekerId === userId;

        if (!isOwner && !isSeeker) {
            throw new ForbiddenException('Acces interzis');
        }

        if (contract.status !== 'accepted' && contract.status !== 'proposed') {
            throw new BadRequestException(`Nu poți semna un contract cu status '${contract.status}'`);
        }

        const now = new Date();

        if (isOwner && !contract.signedByOwnerAt) {
            contract.signedByOwnerAt = now;
        } else if (isSeeker && !contract.signedBySeekerAt) {
            contract.signedBySeekerAt = now;
        }

        // Both signed → mark as signed + set listing to rented
        if (contract.signedByOwnerAt && contract.signedBySeekerAt) {
            contract.status = 'signed';
            await contract.save();

            // Mark listing as rented
            try {
                await Listing.update(
                    { status: 'rented' },
                    { where: { id: contract.listingId } },
                );
            } catch (err: any) {
                console.error('[RentalContractService] Failed to set listing status=rented:', err?.message);
            }

            // Notify the other party that contract is fully signed
            const recipientId = isOwner ? contract.seekerId : contract.ownerId;
            try {
                const listing = await Listing.findByPk(contract.listingId, { attributes: ['title'] });
                await this.notificationService.create(recipientId, {
                    type: 'contract_signed',
                    title: 'Contract semnat de ambele parti',
                    body: `Contractul pentru "${listing?.title || 'proprietate'}" a fost semnat de ambele parti`,
                    metadata: {
                        contractId: contract.id,
                        listingId: contract.listingId,
                    },
                });
            } catch (err: any) {
                console.error('[RentalContractService] Failed to send contract_signed notification:', err?.message);
            }
        } else {
            await contract.save();

            // Notify the other party that one side signed
            const recipientId = isOwner ? contract.seekerId : contract.ownerId;
            const signerRole = isOwner ? 'Proprietarul' : 'Chiriașul';
            try {
                const listing = await Listing.findByPk(contract.listingId, { attributes: ['title'] });
                await this.notificationService.create(recipientId, {
                    type: 'contract_partially_signed',
                    title: 'Contract semnat partial',
                    body: `${signerRole} a semnat contractul pentru "${listing?.title || 'proprietate'}". Acum e randul tau.`,
                    metadata: {
                        contractId: contract.id,
                        listingId: contract.listingId,
                    },
                });
            } catch (err: any) {
                console.error('[RentalContractService] Failed to send partial-sign notification:', err?.message);
            }
        }

        return this.getContract(userId, contractId);
    }

    // =========================================================================
    // GET CONTRACT
    // =========================================================================

    async getContract(userId: number, contractId: number) {
        const contract = await RentalContract.findByPk(contractId, {
            include: [
                {
                    model: Listing,
                    attributes: ['id', 'title', 'addressText', 'priceEur', 'status'],
                },
                {
                    model: User,
                    as: 'owner',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'avatar'],
                },
                {
                    model: User,
                    as: 'seeker',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'avatar'],
                },
            ],
        });

        if (!contract) {
            throw new NotFoundException('Contractul nu a fost găsit');
        }

        if (contract.ownerId !== userId && contract.seekerId !== userId) {
            throw new ForbiddenException('Acces interzis');
        }

        return this.formatContract(contract);
    }

    // =========================================================================
    // GET MY CONTRACTS
    // =========================================================================

    async getMyContracts(userId: number) {
        const contracts = await RentalContract.findAll({
            where: {
                [Op.or]: [{ ownerId: userId }, { seekerId: userId }],
            },
            include: [
                {
                    model: Listing,
                    attributes: ['id', 'title', 'addressText', 'priceEur', 'status'],
                },
                {
                    model: User,
                    as: 'owner',
                    attributes: ['id', 'firstName', 'lastName', 'avatar'],
                },
                {
                    model: User,
                    as: 'seeker',
                    attributes: ['id', 'firstName', 'lastName', 'avatar'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        return contracts.map((c) => this.formatContract(c));
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private async findContractOrFail(contractId: number): Promise<RentalContract> {
        const contract = await RentalContract.findByPk(contractId);
        if (!contract) {
            throw new NotFoundException('Contractul nu a fost găsit');
        }
        return contract;
    }

    private formatContract(contract: RentalContract) {
        const c = contract as any;
        return {
            id: contract.id,
            listingId: contract.listingId,
            ownerId: contract.ownerId,
            seekerId: contract.seekerId,
            status: contract.status,
            monthlyRent: Number(contract.monthlyRent),
            deposit: Number(contract.deposit),
            currency: contract.currency,
            startDate: contract.startDate,
            endDate: contract.endDate,
            terms: contract.terms,
            signedByOwnerAt: contract.signedByOwnerAt ?? null,
            signedBySeekerAt: contract.signedBySeekerAt ?? null,
            createdAt: contract.createdAt,
            updatedAt: contract.updatedAt,
            listing: c.listing
                ? {
                      id: c.listing.id,
                      title: c.listing.title,
                      addressText: c.listing.addressText,
                      priceEur: c.listing.priceEur,
                      status: c.listing.status,
                  }
                : null,
            owner: c.owner
                ? {
                      id: c.owner.id,
                      firstName: c.owner.firstName,
                      lastName: c.owner.lastName,
                      email: c.owner.email,
                      phone: c.owner.phone,
                      avatar: c.owner.avatar,
                  }
                : null,
            seeker: c.seeker
                ? {
                      id: c.seeker.id,
                      firstName: c.seeker.firstName,
                      lastName: c.seeker.lastName,
                      email: c.seeker.email,
                      phone: c.seeker.phone,
                      avatar: c.seeker.avatar,
                  }
                : null,
        };
    }
}
